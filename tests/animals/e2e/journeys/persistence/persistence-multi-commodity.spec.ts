import { test, expect } from '@fixtures';
import { MongoDbClient } from '@adapters/db/mongodb-client';
import { type NotificationDocument } from '@domain/animals/models/db/notification-document';
import { timeouts } from '@config/timeouts';
import { skipUnlessComposeEnvironment } from '@utils/playwright/environment';
import { COW_AND_CAT_ANSWERS, commodityLinesFrom } from '@domain/animals/constants/journey-options';
import { commodities } from '@domain/animals/constants/commodities';

test.describe('Notification persistence — multiple commodities', { tag: '@mongodb' }, () => {
  test.beforeEach(() => {
    skipUnlessComposeEnvironment('the round-trip asserts on Mongo directly, which only the compose stack exposes');
  });

  test('submitted notification persists commodities[] with one entry per commodity', async ({ animalsJourney, journeyContext }) => {
    test.slow();
    const answers = COW_AND_CAT_ANSWERS;
    const [cowLine, catLine] = commodityLinesFrom(answers);
    await animalsJourney.submitNotification(answers);
    const referenceNumber = journeyContext.referenceNumber;
    const client = new MongoDbClient();

    try {
      await client.connect();
      const collection = client.collection<NotificationDocument>('trade-imports-animals-backend', 'notification');
      await expect.poll(() => collection.countDocuments({ referenceNumber }), { timeout: timeouts.short }).toBe(1);

      const [doc] = await collection.find({ referenceNumber }).toArray();
      const storedCommodities = doc.notification.commodities ?? [];
      expect(storedCommodities).toHaveLength(2);

      expect(storedCommodities).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: commodities.cow.display,
            commodityCode: '0102',
            species: expect.arrayContaining([
              expect.objectContaining({
                text: cowLine.species.display,
                animalIdentifiers: [expect.objectContaining({ earTag: cowLine.earTag, passport: cowLine.passportNumber })],
              }),
            ]),
          }),
          expect.objectContaining({
            name: commodities.cat.display,
            commodityCode: '01061900',
            species: expect.arrayContaining([
              expect.objectContaining({
                text: catLine.species.display,
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
