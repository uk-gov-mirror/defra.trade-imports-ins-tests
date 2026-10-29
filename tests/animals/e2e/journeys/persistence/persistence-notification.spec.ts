import { test, expect } from '@fixtures';
import { MongoDbClient } from '@adapters/db/mongodb-client';
import { type NotificationDocument } from '@domain/animals/models/db/notification-document';
import { timeouts } from '@config/timeouts';
import { skipUnlessComposeEnvironment } from '@utils/playwright/environment';
import { ALL_ANSWERS as answers, CPH_NUMBER } from '@domain/animals/constants/journey-options';
import { commodityNames } from '@domain/animals/constants/commodity-names';
import { toIsoDate } from '@utils/date-utils';

test.describe('Notification persistence round-trip', { tag: '@mongodb' }, () => {
  test.beforeEach(() => {
    skipUnlessComposeEnvironment('the round-trip asserts on Mongo directly, which only the compose stack exposes');
  });

  test('draft notification persists as DRAFT up to declaration', async ({ animalsJourney, journeyContext }) => {
    test.slow();
    await animalsJourney.toDeclaration();
    const referenceNumber = journeyContext.referenceNumber;
    const client = new MongoDbClient();

    try {
      await client.connect();
      const collection = client.collection<NotificationDocument>('trade-imports-animals-backend', 'notification');
      await expect.poll(() => collection.countDocuments({ referenceNumber }), { timeout: timeouts.short }).toBe(1);

      const [doc] = await collection.find({ referenceNumber }).toArray();
      expect(doc.referenceNumber).toBe(referenceNumber);
      expect(doc.status).toBe('DRAFT');
    } finally {
      await client.close();
    }
  });

  test('submitted notification persists the journey answers and reloads read-only', async ({
    animalsJourney,
    journeyContext,
    animalsPages,
    addressBookApi,
  }) => {
    test.slow();
    const consignor = await addressBookApi.findByName(answers.parties.consignor);
    const destination = await addressBookApi.findByName(answers.parties.placeOfDestination);
    const placeOfOrigin = await addressBookApi.findByName(answers.parties.placeOfOrigin);
    const consignee = await addressBookApi.findByName(answers.parties.consignee);
    const importer = await addressBookApi.findByName(answers.parties.importer);
    const contact = await addressBookApi.findByName(answers.contactAddress);
    const [cowLine] = answers.commodityLines;

    await animalsJourney.submitNotification(answers);
    const referenceNumber = journeyContext.referenceNumber;
    const client = new MongoDbClient();

    try {
      await client.connect();
      const collection = client.collection<NotificationDocument>('trade-imports-animals-backend', 'notification');
      await expect.poll(() => collection.countDocuments({ referenceNumber }), { timeout: timeouts.short }).toBe(1);

      const [doc] = await collection.find({ referenceNumber }).toArray();
      const { notification } = doc;
      const commodities = notification.commodities;
      expect(commodities).toHaveLength(1);
      const cow = commodities[0];
      const [species] = cow.species;

      expect(doc.referenceNumber).toBe(referenceNumber);
      expect(doc.status).toBe('SUBMITTED');
      expect(notification.origin.countryCode).toBe(answers.countryCode.value);
      expect(notification.origin.requiresRegionCode).toBe('yes');
      expect(notification.origin.regionOfOriginCode).toBe(`${answers.countryCode.value}-${answers.regionCode}`);
      expect(notification.origin.internalReference).toBe(answers.internalReference);
      expect(cow.name).toBe(commodityNames[cowLine.species.commodityCode]);
      expect(cow.commodityCode).toBe(cowLine.species.commodityCode);
      expect(species.text).toBe(cowLine.species.latinName);
      expect(species.earTag).toBe(cowLine.earTag);
      expect(species.animalIdentifiers).toEqual([{ earTag: cowLine.earTag, passport: cowLine.passportNumber }]);
      expect(cow.totalNoOfAnimals).toBe(cowLine.noOfAnimals);
      expect(cow.totalNoOfPackages).toBe(cowLine.noOfPackages);
      expect(notification.reasonForImport).toBe(answers.importReason.value);
      expect(notification.purposeInInternalMarket).toBe(answers.internalMarketPurpose.value);
      expect(notification.additionalDetails.certifiedFor).toBe(answers.certifiedFor.value);
      expect(notification.additionalDetails.unweanedAnimals).toBe(answers.unweanedAnimals.toLowerCase());
      expect(notification.consignor).not.toHaveProperty('addressId');
      expect(notification.consignor).toMatchObject({
        name: consignor.name,
        email: consignor.email,
        phone: consignor.phone,
        address: {
          addressLine1: consignor.addressLine1,
          townOrCity: consignor.townOrCity,
          postcode: consignor.postcode,
          countryCode: consignor.countryCode,
        },
      });
      expect(notification.destination).toMatchObject({ name: destination.name, address: { postcode: destination.postcode } });
      expect(notification.consignee).toMatchObject({ name: consignee.name, address: { postcode: consignee.postcode } });
      expect(notification.importer).toMatchObject({ name: importer.name, address: { postcode: importer.postcode } });
      expect(notification.placeOfOrigin).toMatchObject({ name: placeOfOrigin.name, address: { postcode: placeOfOrigin.postcode } });
      expect(notification.consignment).toMatchObject({ name: contact.name, address: { postcode: contact.postcode } });
      expect(doc.preAmendNotification).toBeUndefined();
      expect(notification.cphNumber).toBe(CPH_NUMBER);
      expect(notification.transport.portOfEntry).toBe(answers.pointOfEntry.value);
      expect(notification.transport.meansOfTransport).toBe(answers.meansOfTransport.value);
      expect(notification.transport.transportIdentification).toBe(answers.transportIdentification);
      expect(notification.transport.transportDocumentReference).toBe(answers.transportDocumentReference);
      expect(notification.transport.transitedCountries).toEqual(answers.transitedCountries.map(({ value }) => value));
      expect(notification.transport.transporter?.name).toBe(answers.transporter.display);
      expect(notification.transport.transporter?.type).toBe('Commercial');
      const [day, month, year] = answers.arrivalDate.split('/');
      expect(notification.transport.arrivalDate).toBe(toIsoDate({ day, month, year }));
    } finally {
      await client.close();
    }

    await animalsPages.notificationView.open(referenceNumber);
    await expect(animalsPages.notificationView.heading).toBeVisible();
    await expect(animalsPages.notificationView.journeyStrip).toContainText('Submitted');
  });
});
