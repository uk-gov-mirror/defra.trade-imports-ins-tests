import { test, expect } from '@fixtures/visual';

test.use({ headless: true });

test.describe('Transited countries (visual regression)', { tag: '@visual' }, () => {
  test.beforeEach(async ({ animalsJourney }) => {
    await animalsJourney.toTransitedCountries();
  });

  test('shows expected page appearance with no country added', async ({ page, animalsPages }) => {
    await expect(page).toHaveScreenshot('transited-countries-empty.png', {
      fullPage: true,
      mask: [animalsPages.transitedCountries.journeyStrip],
    });
  });

  test('shows expected page appearance with one country added', async ({ page, animalsPages }) => {
    await animalsPages.transitedCountries.addCountry('France');

    await expect(page).toHaveScreenshot('transited-countries-one-country.png', {
      fullPage: true,
      mask: [animalsPages.transitedCountries.journeyStrip],
    });
  });
});
