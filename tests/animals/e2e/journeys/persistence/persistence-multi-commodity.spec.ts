import { test, expect } from '@fixtures';
import { MongoDbClient } from '@adapters/db/mongodb-client';
import { type NotificationDocument } from '@domain/animals/models/db/notification-document';
import { timeouts } from '@config/timeouts';
import { skipUnlessComposeEnvironment } from '@utils/playwright/environment';
import { ALL_COMMODITY_LINES } from '@domain/animals/constants/journey-commodity-line-answers';
import { commodityNames } from '@domain/animals/constants/commodity-names';
import { ALL_ANSWERS, type AllAnswers } from '@domain/animals/constants/journey-options';

test.describe('Notification persistence — multiple commodities', { tag: '@mongodb' }, () => {
  test.beforeEach(() => {
    skipUnlessComposeEnvironment('the round-trip asserts on Mongo directly, which only the compose stack exposes');
  });

  test('submitted notification persists commodities[] with one entry per commodity', async ({ animalsJourney, journeyContext }) => {
    test.slow();
    const answers: AllAnswers = { ...ALL_ANSWERS, commodityLines: [...ALL_ANSWERS.commodityLines, ALL_COMMODITY_LINES.domesticCat] };
    const [cowLine, catLine] = answers.commodityLines;
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
            name: commodityNames[cowLine.species.commodityCode],
            commodityCode: cowLine.species.commodityCode,
            species: expect.arrayContaining([
              expect.objectContaining({
                text: cowLine.species.latinName,
                animalIdentifiers: [expect.objectContaining({ earTag: cowLine.earTag, passport: cowLine.passportNumber })],
              }),
            ]),
          }),
          expect.objectContaining({
            name: commodityNames[catLine.species.commodityCode],
            commodityCode: catLine.species.commodityCode,
            species: expect.arrayContaining([
              expect.objectContaining({
                text: catLine.species.latinName,
                animalIdentifiers: [
                  expect.objectContaining({
                    passport: catLine.passportNumber,
                    microchip: catLine.microchip,
                    tattoo: catLine.tattoo,
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
