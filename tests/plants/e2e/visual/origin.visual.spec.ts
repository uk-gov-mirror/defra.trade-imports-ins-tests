import { test, expect } from '@fixtures/visual';
import { POTATOES } from '@flows/plants/journey';

test.use({ headless: true });

test.describe('Plants origin (visual regression)', { tag: '@visual' }, () => {
  test.beforeEach(async ({ plantsJourney }) => {
    await plantsJourney.toOriginOfNewNotification(POTATOES);
  });

  test('shows the empty country type-ahead with its joined search button', async ({ page, plantsPages }) => {
    await expect(page).toHaveScreenshot('plants-origin.png', {
      fullPage: true,
      mask: [plantsPages.origin.journeyStrip],
    });
  });

  test('shows the country suggestions listed under the type-ahead', async ({ page, plantsPages }) => {
    await plantsPages.origin.country.search('Fra');
    await expect(plantsPages.origin.country.option('France')).toBeVisible();

    await expect(page).toHaveScreenshot('plants-origin-suggestions.png', {
      fullPage: true,
      mask: [plantsPages.origin.journeyStrip],
    });
  });
});
