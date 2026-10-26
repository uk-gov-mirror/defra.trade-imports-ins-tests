import { test, expect } from '@fixtures';
import { MongoDbClient } from '@adapters/db/mongodb-client';
import { MANDATORY_ANSWERS } from '@domain/animals/constants/journey-options';
import { type AggregatedNotificationDocument } from '@domain/ins/models/db/aggregated-notification-document';
import { timeouts } from '@config/timeouts';
import { getMongoDbUri } from '@config/service-base-urls';
import { skipUnlessComposeEnvironment } from '@utils/playwright/environment';

const aggregateIdFor = (referenceNumber: string): string => `Imports.Notification.GBN-AG.${referenceNumber}`;

test.describe('Aggregated notification store', { tag: ['@compose', '@mongodb', '@animals-backend'] }, () => {
  test.beforeEach(() => {
    skipUnlessComposeEnvironment('aggregated notification assertions read Mongo directly, which only the compose stack exposes');
  });

  test('creates and updates aggregated notification document through the submission lifecycle', async ({
    animalsJourney,
    journeyContext,
    pages,
    animalsPages,
  }) => {
    test.slow();

    // Given — complete the journey up to the declaration page (notification is in DRAFT)
    await animalsJourney.toDeclaration();
    const referenceNumber = journeyContext.referenceNumber;
    const aggregateId = aggregateIdFor(referenceNumber);
    const client = new MongoDbClient(getMongoDbUri());

    try {
      await client.connect();
      const collection = client.collection<AggregatedNotificationDocument>('trade-imports-ins-backend', 'notifications');

      // When — notification has been edited but not yet submitted
      // Then — aggregated store should reflect DRAFT status with all fields populated.

      // NOTIFICATION_CREATED fires immediately at creation (before transport details are filled in),
      // so we poll for the specific fully-populated state rather than bare status=DRAFT. The document
      // is captured inside the poll — no redundant second read needed.
      let draftDoc: AggregatedNotificationDocument | null = null;
      await expect
        .poll(
          async () => {
            draftDoc = await collection.findOne({
              _id: aggregateId,
              status: 'DRAFT',
              referenceNumber: referenceNumber,
              originCountry: MANDATORY_ANSWERS.countryCode.value,
              arrivalDate: { $exists: true },
            });
            return draftDoc;
          },
          { timeout: timeouts.long },
        )
        .not.toBeNull();

      if (!draftDoc) throw new Error('Expected draft document to exist after polling');

      expect(draftDoc._id).toBe(aggregateId);
      expect(draftDoc.referenceNumber).toBe(referenceNumber);
      expect(draftDoc.status).toBe('DRAFT');
      expect(draftDoc.originCountry).toBe(MANDATORY_ANSWERS.countryCode.value);
      // INS upsert reads the first GBN-AG trade line description, then commonName.
      expect(draftDoc.commodity).toBe(MANDATORY_ANSWERS.species.commodity.lineDescription);
      expect(draftDoc.arrivalDate).toBeInstanceOf(Date);
      expect(draftDoc.arrivalDate.getTime()).toBeGreaterThan(Date.now());
      expect(draftDoc.lastUpdated).toBeInstanceOf(Date);
      expect(draftDoc.aggregateVersion).toBeGreaterThan(0);

      const draftVersion = draftDoc.aggregateVersion;

      // When — notification is submitted
      await animalsPages.declaration.confirmation.check();
      await animalsPages.declaration.continueButton.click();
      await pages.page.getByRole('heading', { name: 'Import notification submitted' }).waitFor();

      // Then — same document is updated to SUBMITTED (no duplicate created)
      await expect.poll(() => collection.findOne({ _id: aggregateId, status: 'SUBMITTED' }), { timeout: timeouts.long }).not.toBeNull();

      expect(await collection.countDocuments({ _id: aggregateId })).toBe(1);

      const submittedDoc = await collection.findOne({ _id: aggregateId });
      expect(submittedDoc._id).toBe(aggregateId);
      expect(submittedDoc.referenceNumber).toBe(referenceNumber);
      expect(submittedDoc.status).toBe('SUBMITTED');
      expect(submittedDoc.originCountry).toBe(MANDATORY_ANSWERS.countryCode.value);
      expect(submittedDoc.commodity).toBe(MANDATORY_ANSWERS.species.commodity.lineDescription);
      expect(submittedDoc.arrivalDate).toBeInstanceOf(Date);
      expect(submittedDoc.arrivalDate.getTime()).toBeGreaterThan(Date.now());
      expect(submittedDoc.lastUpdated).toBeInstanceOf(Date);
      expect(submittedDoc.aggregateVersion).toBeGreaterThan(draftVersion);
    } finally {
      await client.close();
    }
  });
});
