import { test, expect } from '@fixtures';
import { MongoDbClient } from '@adapters/db/mongodb-client';
import { GBN_AG_CATTLE_COMMON_NAME } from '@domain/animals/constants/gbn-ag';
import { ALL_ANSWERS as answers, CPH_NUMBER, MANDATORY_ANSWERS } from '@domain/animals/constants/journey-options';
import { countryCodes } from '@domain/animals/constants/country-codes';
import { type OutboxEventActor, type OutboxEventDocument } from '@domain/animals/models/db/outbox-event-document';
import { timeouts } from '@config/timeouts';
import { users } from '@config/users';
import { skipUnlessComposeEnvironment } from '@utils/playwright/environment';

const NOTIFICATION_SUBMITTED = 'uk.gov.defra.imports.notification.NotificationSubmitted';
const LIVE_BOVINE_LINE_DESCRIPTION = 'Live bovine animals';
const SUBDIVISION_FUNCTION_TYPE_CODE = '106';
const VETERINARY_CERTIFICATE_TYPE_CODE = '853';
const EXPECTED_ACTOR: OutboxEventActor = {
  id: users.andrew.crn,
  source: 'dynamics-contact',
  userType: 'B2C',
  displayName: users.andrew.displayName,
  organisationId: users.andrew.organisationId,
  onBehalfOfOrganisationId: null,
};

const aggregateIdFor = (referenceNumber: string): string => `Imports.Notification.GBN-AG.${referenceNumber}`;

const actorWithNullableFields = (actor?: OutboxEventActor | null): OutboxEventActor => ({
  id: actor?.id ?? null,
  source: actor?.source ?? null,
  userType: actor?.userType ?? null,
  displayName: actor?.displayName ?? null,
  organisationId: actor?.organisationId ?? null,
  onBehalfOfOrganisationId: actor?.onBehalfOfOrganisationId ?? null,
});

test.describe('Notification outbox event', { tag: '@mongodb' }, () => {
  test.beforeEach(() => {
    skipUnlessComposeEnvironment('outbox assertions read Mongo directly, which only the compose stack exposes');
  });

  test('records a NotificationSubmitted outbox event on UI submission', async ({ animalsJourney, journeyContext }) => {
    test.slow();
    await animalsJourney.submitNotification(answers);
    const referenceNumber = journeyContext.referenceNumber;
    const aggregateId = aggregateIdFor(referenceNumber);
    const [cowLine] = answers.commodityLines;
    const client = new MongoDbClient();

    try {
      await client.connect();
      const collection = client.collection<OutboxEventDocument>('trade-imports-animals-backend', 'outbox');
      await expect
        .poll(() => collection.countDocuments({ aggregateId, eventType: NOTIFICATION_SUBMITTED }), { timeout: timeouts.long })
        .toBe(1);

      const docs = await collection.find({ aggregateId, eventType: NOTIFICATION_SUBMITTED }).toArray();
      const [doc] = docs;
      const data = doc.data;
      const statusChanges = doc.statusChanges ?? [];

      expect(doc._id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      expect(doc.aggregateId).toBe(aggregateId);
      expect(doc.aggregateType).toBe('Notification');
      expect(doc.subType).toBe('GBN-AG');
      expect(doc.eventType).toBe(NOTIFICATION_SUBMITTED);
      expect(doc.timestamp).toBeInstanceOf(Date);
      expect(doc.metadata.schemaVersion).toBe('1');
      expect(doc.metadata.correlationId).toBeDefined();
      expect(data.$model).toBe('defra/certificate-internal/1');
      expect(data.$type).toBe('gbn-ag');
      expect(data.exchangedDocument.identifier).toBe(referenceNumber);
      expect(data.exchangedDocument.notificationStatusCode).toBe('SUBMITTED');
      expect(data.exchangedDocument.referenceDocument).toEqual([
        {
          typeCode: VETERINARY_CERTIFICATE_TYPE_CODE,
          urlId: 'https://refdata.tbc.defra.gov.uk/gbn-ag-document-types',
          identifier: answers.accompanyingDocument.reference,
          issueDateTime: '2026-01-03',
        },
      ]);
      expect(data.specifiedConsignment.consignorParty?.name).toBe(answers.parties.consignor);
      expect(data.specifiedConsignment.originCountry?.code?.value).toBe(answers.countryCode.value);
      expect(data.specifiedConsignment.unloadingBaseportLocation?.identifier).toBe(answers.pointOfEntry.value);
      expect(data.specifiedConsignment.includedConsignmentItem).toHaveLength(1);
      const originCountry = data.specifiedConsignment.originCountry;
      expect(originCountry?.regionOfOriginCode).toBe(`${answers.countryCode.value}-${answers.regionCode}`);
      expect(originCountry).not.toHaveProperty('subordinateTradeCountrySubDivision');
      expect(data.specifiedConsignment.finalDestinationLocation?.identifier).toBe(CPH_NUMBER);
      expect(data.specifiedConsignment.finalDestinationLocation?.urlId).toBe('https://refdata.tbc.defra.gov.uk/cph_number');
      const transitCountries = data.specifiedConsignment.transitTradeCountry ?? [];
      expect(transitCountries).toHaveLength(2);
      expect(transitCountries[0].code?.value).toBe(answers.transitedCountries[0].value);
      expect(transitCountries[1].code?.value).toBe(answers.transitedCountries[1].value);
      for (const transitCountry of transitCountries) {
        expect(transitCountry).not.toHaveProperty('subordinateTradeCountrySubDivision');
        expect(transitCountry).not.toHaveProperty('regionOfOriginCode');
      }
      const [movement] = data.specifiedConsignment.mainCarriageLogisticsTransportMovement ?? [];
      const [transportDocument] = movement.transportContractRelatedReferencedDocument ?? [];
      expect(transportDocument.typeCode).toBe('730');
      expect(transportDocument.identifier).toBe(answers.transportDocumentReference);
      const tradeLines = data.specifiedConsignment.includedConsignmentItem?.[0].includedTradeLineItem ?? [];
      expect(tradeLines).toHaveLength(1);
      const [line] = tradeLines;
      expect(line.description).toEqual([LIVE_BOVINE_LINE_DESCRIPTION]);
      expect(line.commonName).toBe(GBN_AG_CATTLE_COMMON_NAME);
      expect(line.scientificName).toBe(cowLine.species.latinName);
      expect(line.specifiedLineTradeDelivery?.[0].productUnitQuantity.content).toBe(cowLine.noOfAnimals);
      expect(line.physicalReferencedLogisticsPackage?.[0].itemQuantity).toBe(cowLine.noOfPackages);
      const animals = line.individualTradeProductInstance ?? [];
      expect(animals).toHaveLength(1);
      expect(animals[0].identifier).toHaveLength(2);
      expect(animals[0].identifier).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ typeCode: 'EAR_TAG', content: cowLine.earTag }),
          expect.objectContaining({ typeCode: 'PASSPORT', content: cowLine.passportNumber }),
        ]),
      );
      expect(actorWithNullableFields(doc.actor)).toEqual(EXPECTED_ACTOR);
      expect(statusChanges).toHaveLength(2);
      expect(statusChanges[0].status).toBe('DRAFT');
      expect(statusChanges[0].dateChanged).toEqual(expect.any(Date));
      expect(statusChanges[1].status).toBe('SUBMITTED');
      expect(statusChanges[1].dateChanged).toEqual(expect.any(Date));
      expect(actorWithNullableFields(statusChanges[1].actor)).toEqual(EXPECTED_ACTOR);
    } finally {
      await client.close();
    }
  });

  test('carries a country subdivision and the region of origin code separately on the NotificationSubmitted event', async ({
    animalsJourney,
    journeyContext,
  }) => {
    test.slow();
    await animalsJourney.submitNotification({
      ...MANDATORY_ANSWERS,
      countryCode: countryCodes.subdivisions.canaryIslands,
      requiresRegionCode: answers.requiresRegionCode,
      regionCode: answers.regionCode,
    });
    const aggregateId = aggregateIdFor(journeyContext.referenceNumber);
    const client = new MongoDbClient();

    try {
      await client.connect();
      const collection = client.collection<OutboxEventDocument>('trade-imports-animals-backend', 'outbox');
      await expect
        .poll(() => collection.countDocuments({ aggregateId, eventType: NOTIFICATION_SUBMITTED }), { timeout: timeouts.long })
        .toBe(1);

      const doc = await collection.findOne({ aggregateId, eventType: NOTIFICATION_SUBMITTED });
      const originCountry = doc?.data.specifiedConsignment.originCountry;
      expect(originCountry?.code?.value).toBe('ES');
      expect(originCountry?.subordinateTradeCountrySubDivision).toEqual([
        {
          identifier: 'ES-CN',
          urlId: 'https://refdata.tbc.defra.gov.uk/country_subdivisions',
          functionTypeCode: { content: SUBDIVISION_FUNCTION_TYPE_CODE },
        },
      ]);
      expect(originCountry?.regionOfOriginCode).toBe(`ES-${answers.regionCode}`);
    } finally {
      await client.close();
    }
  });

  test('references a scanned accompanying document on the NotificationSubmitted event, coded from the document-type codelist', async ({
    animalsJourney,
    journeyContext,
  }) => {
    test.slow();
    const documentReference = `PWREF${Date.now()}`;
    await animalsJourney.submitNotification({
      ...MANDATORY_ANSWERS,
      accompanyingDocument: { ...answers.accompanyingDocument, reference: documentReference },
    });
    const aggregateId = aggregateIdFor(journeyContext.referenceNumber);
    const client = new MongoDbClient();

    try {
      await client.connect();
      const collection = client.collection<OutboxEventDocument>('trade-imports-animals-backend', 'outbox');
      await expect
        .poll(() => collection.countDocuments({ aggregateId, eventType: NOTIFICATION_SUBMITTED }), { timeout: timeouts.long })
        .toBe(1);

      const doc = await collection.findOne({ aggregateId, eventType: NOTIFICATION_SUBMITTED });
      expect(doc?.data.exchangedDocument.referenceDocument).toEqual([
        {
          typeCode: VETERINARY_CERTIFICATE_TYPE_CODE,
          urlId: 'https://refdata.tbc.defra.gov.uk/gbn-ag-document-types',
          identifier: documentReference,
          issueDateTime: '2026-01-03',
        },
      ]);
    } finally {
      await client.close();
    }
  });
});
