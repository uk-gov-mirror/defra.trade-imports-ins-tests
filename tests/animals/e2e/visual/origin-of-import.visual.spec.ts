import { test, expect } from '@fixtures/visual';
import { countryCodes } from '@domain/animals/constants/country-codes';

test.use({ headless: true });

test.describe('Origin of import (visual regression)', { tag: '@visual' }, () => {
  test.beforeEach(async ({ animalsJourney }) => {
    await animalsJourney.toOriginOfImport();
  });

  test('shows expected page appearance on first load', async ({ page, animalsPages }) => {
    await expect(page).toHaveScreenshot('origin-of-import.png', {
      fullPage: true,
      mask: [animalsPages.originOfImport.journeyStrip],
    });
  });

  test('shows the chosen country and the revealed region of origin code box', async ({ page, animalsPages }) => {
    const origin = animalsPages.originOfImport;
    await origin.country.choose(countryCodes.eu.france.display);
    await origin.radioRequiresOriginCode('Yes').check();
    await expect(origin.regionCode).toBeVisible();

    await expect(page).toHaveScreenshot('origin-of-import-region-code-revealed.png', {
      fullPage: true,
      mask: [origin.journeyStrip],
    });
  });
});
