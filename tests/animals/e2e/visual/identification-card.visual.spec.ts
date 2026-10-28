import { commodityLines } from '@domain/animals/constants/commodity-lines';

import { test, expect } from '@fixtures/visual';

test.use({ headless: true });

test.describe('Identification card (visual regression)', { tag: '@visual' }, () => {
  test.beforeEach(async ({ page, animalsJourney }) => {
    await animalsJourney.toAnimalIdentificationWithCounts([{ species: commodityLines.domesticCat, animalCount: 2 }]);
    await animalsJourney.saveAnimalWithPermanentAddress();
    await expect(page.getByRole('heading', { name: 'Enter details for Felis catus 2 of 2' })).toBeVisible();
  });

  test('shows the entry form for the second cat above the saved animals table', async ({ page, animalsPages }) => {
    await expect(page).toHaveScreenshot('identification-card.png', {
      fullPage: true,
      mask: [animalsPages.animalIdentification.journeyStrip],
    });
  });
});
