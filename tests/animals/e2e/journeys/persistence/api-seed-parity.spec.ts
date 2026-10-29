import { test, expect } from '@fixtures';
import { MongoDbClient } from '@adapters/db/mongodb-client';
import { ALL_COMMODITY_LINES } from '@domain/animals/constants/journey-commodity-line-answers';
import { ALL_ANSWERS_WITHOUT_DOCUMENT, MANDATORY_ANSWERS } from '@domain/animals/constants/journey-options';
import { type NotificationDocument } from '@domain/animals/models/db/notification-document';
import { timeouts } from '@config/timeouts';
import { skipUnlessComposeEnvironment } from '@utils/playwright/environment';

const OTHER_CONSIGNOR_NAME = 'Alpine Dairy GmbH';

test.describe('Seeded and browser-driven notifications match', { tag: '@mongodb' }, () => {
  test.beforeEach(() => {
    skipUnlessComposeEnvironment('the comparison reads both stored documents from Mongo, which only the compose stack exposes');
  });

  const readStoredNotification = async (client: MongoDbClient, referenceNumber: string | undefined): Promise<NotificationDocument> => {
    const collection = client.collection<NotificationDocument>('trade-imports-animals-backend', 'notification');
    await expect.poll(() => collection.countDocuments({ referenceNumber }), { timeout: timeouts.short }).toBe(1);
    const [storedNotification] = await collection.find({ referenceNumber }).toArray();
    return storedNotification;
  };

  const readBothStoredNotifications = async (browserReference: string | undefined, seededReference: string | undefined) => {
    const client = new MongoDbClient();
    try {
      await client.connect();
      return {
        browserDoc: await readStoredNotification(client, browserReference),
        seededDoc: await readStoredNotification(client, seededReference),
      };
    } finally {
      await client.close();
    }
  };

  test('a seeded notification stores what the same mandatory-only journey stores through the browser', async ({
    animalsJourney,
    journeyContext,
    animalsSeededJourney,
  }) => {
    test.slow();
    await animalsJourney.submitNotification();
    const browserReference = journeyContext.referenceNumber;
    const seededReference = await animalsSeededJourney.createSubmittedNotification();

    const { browserDoc, seededDoc } = await readBothStoredNotifications(browserReference, seededReference);

    expect(seededDoc.status).toBe(browserDoc.status);
    expect(seededDoc.notification).toEqual(browserDoc.notification);
    expect(seededDoc.fulfilments).toEqual(browserDoc.fulfilments);
  });

  test('a seeded notification stores what the same all-answers-without-document journey stores through the browser', async ({
    animalsJourney,
    journeyContext,
    animalsSeededJourney,
  }) => {
    test.slow();
    await animalsJourney.submitNotification(ALL_ANSWERS_WITHOUT_DOCUMENT);
    const browserReference = journeyContext.referenceNumber;
    const seededReference = await animalsSeededJourney.createSubmittedNotification(ALL_ANSWERS_WITHOUT_DOCUMENT);

    const { browserDoc, seededDoc } = await readBothStoredNotifications(browserReference, seededReference);

    expect(seededDoc.status).toBe(browserDoc.status);
    expect(seededDoc.notification).toEqual(browserDoc.notification);
    expect(seededDoc.fulfilments).toEqual(browserDoc.fulfilments);
  });

  test('a seeded notification names the party the answers name, as the browser journey does', async ({
    animalsJourney,
    journeyContext,
    animalsSeededJourney,
  }) => {
    test.slow();
    const answers = { ...MANDATORY_ANSWERS, parties: { ...MANDATORY_ANSWERS.parties, consignor: OTHER_CONSIGNOR_NAME } };
    await animalsJourney.submitNotification(answers);
    const browserReference = journeyContext.referenceNumber;
    const seededReference = await animalsSeededJourney.createSubmittedNotification(answers);

    const { browserDoc, seededDoc } = await readBothStoredNotifications(browserReference, seededReference);

    expect(browserDoc.notification.consignor?.name).toBe(OTHER_CONSIGNOR_NAME);
    expect(seededDoc.notification.consignor?.name).toBe(OTHER_CONSIGNOR_NAME);
    expect(seededDoc.notification).toEqual(browserDoc.notification);
  });

  test('a seeded notification stores what the same cow-and-cat journey stores through the browser', async ({
    animalsJourney,
    journeyContext,
    animalsSeededJourney,
  }) => {
    test.slow();
    const answers = {
      ...ALL_ANSWERS_WITHOUT_DOCUMENT,
      commodityLines: [...ALL_ANSWERS_WITHOUT_DOCUMENT.commodityLines, ALL_COMMODITY_LINES.domesticCat],
    };
    await animalsJourney.submitNotification(answers);
    const browserReference = journeyContext.referenceNumber;
    const seededReference = await animalsSeededJourney.createSubmittedNotification(answers);

    const { browserDoc, seededDoc } = await readBothStoredNotifications(browserReference, seededReference);

    expect(seededDoc.status).toBe(browserDoc.status);
    expect(seededDoc.notification).toEqual(browserDoc.notification);
    expect(seededDoc.fulfilments).toEqual(browserDoc.fulfilments);
  });
});
