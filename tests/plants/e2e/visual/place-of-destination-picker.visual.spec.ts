import { test, expect } from '@fixtures/visual';
import { POTATOES } from '@flows/plants/journey';

test.use({ headless: true });

test.describe('Plants place of destination picker (visual regression)', { tag: '@visual' }, () => {
  test('shows the address search box with its label, hint and joined search button', async ({ plantsJourney, plantsPages }) => {
    await plantsJourney.toDestinationOfNewNotification(POTATOES);

    await expect(plantsPages.placeOfDestination.searchRow).toHaveScreenshot('plants-place-of-destination-search-row.png');
  });
});
