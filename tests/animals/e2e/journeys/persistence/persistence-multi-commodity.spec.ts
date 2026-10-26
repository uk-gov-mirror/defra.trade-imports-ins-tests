import { test, expect } from '@fixtures';
import { MongoDbClient } from '@adapters/db/mongodb-client';
import { type NotificationDocument } from '@domain/animals/models/db/notification-document';
import { timeouts } from '@config/timeouts';
import { skipUnlessComposeEnvironment } from '@utils/playwright/environment';
import { ALL_ANSWERS as answers } from '@domain/animals/constants/journey-options';

test.describe('Notification persistence — multiple commodities', { tag: '@mongodb' }, () => {
  test.beforeEach(() => {
    skipUnlessComposeEnvironment('the round-trip asserts on Mongo directly, which only the compose stack exposes');
  });

  test('submitted notification persists commodities[] with one entry per commodity', async ({ animalsJourney, journeyContext }) => {
    test.slow();
    await animalsJourney.submitNotificationWithCowAndCat(answers);
    const referenceNumber = journeyContext.referenceNumber;
    const client = new MongoDbClient();

    try {
      await client.connect();
      const collection = client.collection<NotificationDocument>('trade-imports-animals-backend', 'notification');
      await expect.poll(() => collection.countDocuments({ referenceNumber }), { timeout: timeouts.short }).toBe(1);

      const [doc] = await collection.find({ referenceNumber }).toArray();
      const commodities = doc.notification.commodities ?? [];
      expect(commodities).toHaveLength(2);

      const cow = commodities.find((entry) => entry.name === 'Cow');
      const cat = commodities.find((entry) => entry.name === 'Cat');
      expect(cow, 'Cow commodity line').toBeDefined();
      expect(cat, 'Cat commodity line').toBeDefined();

      expect(cow.commodityCode).toBe('0102');
      expect(cat.commodityCode).toBe('01061900');

      const cowSpecies = cow.species.find((line) => line.text === 'Bos taurus');
      const catSpecies = cat.species.find((line) => line.text === 'Felis catus');
      expect(cowSpecies, 'Bos taurus species line').toBeDefined();
      expect(catSpecies, 'Felis catus species line').toBeDefined();

      expect(cowSpecies.earTag ?? cowSpecies.animalIdentifiers?.[0]?.earTag).toBe(answers.earTag);
      expect(catSpecies.passport ?? catSpecies.animalIdentifiers?.[0]?.passport).toBe('UK-CAT-1');
      expect(catSpecies.microchip ?? catSpecies.animalIdentifiers?.[0]?.microchip).toBe('900987654321098');

      expect(doc.status).toBe('SUBMITTED');
    } finally {
      await client.close();
    }
  });
});
