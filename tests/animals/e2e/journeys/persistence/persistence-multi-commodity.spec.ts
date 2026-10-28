import { test, expect } from '@fixtures';
import { MongoDbClient } from '@adapters/db/mongodb-client';
import { type NotificationDocument } from '@domain/animals/models/db/notification-document';
import { timeouts } from '@config/timeouts';
import { skipUnlessComposeEnvironment } from '@utils/playwright/environment';
import { ALL_ANSWERS, catLine } from '@domain/animals/constants/journey-options';
import { commodityLines, commodityNames } from '@domain/animals/constants/commodity-lines';

test.describe('Notification persistence — multiple commodities', { tag: '@mongodb' }, () => {
  test.beforeEach(() => {
    skipUnlessComposeEnvironment('the round-trip asserts on Mongo directly, which only the compose stack exposes');
  });

  test('submitted notification persists commodities[] with one entry per commodity', async ({ animalsJourney, journeyContext }) => {
    test.slow();
    const answers = { ...ALL_ANSWERS, commodityLines: [...ALL_ANSWERS.commodityLines, catLine] };
    const [cowLine] = answers.commodityLines;
    await animalsJourney.submitNotification(answers);
    const referenceNumber = journeyContext.referenceNumber;
    const client = new MongoDbClient();

    try {
      await client.connect();
      const collection = client.collection<NotificationDocument>('trade-imports-animals-backend', 'notification');
      await expect.poll(() => collection.countDocuments({ referenceNumber }), { timeout: timeouts.short }).toBe(1);

      const [doc] = await collection.find({ referenceNumber }).toArray();
      const storedCommodities = doc.notification.commodities;
      expect(storedCommodities).toHaveLength(2);

      expect(storedCommodities).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: commodityNames.cattle,
            commodityCode: commodityLines.cattle.commodityCode,
            species: expect.arrayContaining([
              expect.objectContaining({
                text: cowLine.species.latinName,
                animalIdentifiers: [expect.objectContaining({ earTag: cowLine.earTag, passport: cowLine.passportNumber })],
              }),
            ]),
          }),
          expect.objectContaining({
            name: commodityNames.domesticCat,
            commodityCode: commodityLines.domesticCat.commodityCode,
            species: expect.arrayContaining([
              expect.objectContaining({
                text: catLine.species.latinName,
                animalIdentifiers: [
                  expect.objectContaining({
                    passport: catLine.passportNumber,
                    microchip: catLine.microchip,
                  }),
                ],
              }),
            ]),
          }),
        ]),
      );

      expect(doc.status).toBe('SUBMITTED');
    } finally {
      await client.close();
    }
  });
});
