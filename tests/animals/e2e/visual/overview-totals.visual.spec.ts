import { test, expect } from '@fixtures/visual';

test.use({ headless: true });

test.describe('Overview totals (visual regression)', { tag: '@visual' }, () => {
  test.beforeEach(async ({ animalsJourney }) => {
    await animalsJourney.toOverviewWithSavedCounts({ animals: '12', packages: '3' });
  });

  test('shows the animal and package totals as two side-by-side panels', async ({ page, animalsPages }) => {
    await expect(page).toHaveScreenshot('overview-totals.png', {
      fullPage: true,
      mask: [animalsPages.overview.journeyStrip],
    });
  });
});
