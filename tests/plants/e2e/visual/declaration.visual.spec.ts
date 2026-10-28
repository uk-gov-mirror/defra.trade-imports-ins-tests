import { test, expect } from '@fixtures/visual';

test.use({ headless: true });

test.describe('Plants declaration (visual regression)', { tag: '@visual' }, () => {
  test.beforeEach(async ({ plantsJourney, addressBookApi }) => {
    await plantsJourney.completeNotification(addressBookApi);
    await plantsJourney.toDeclarationFromReview();
  });

  test('shows the declaration statements, the small confirmation checkbox and no visible legend', async ({ page, plantsPages }) => {
    await expect(page).toHaveScreenshot('plants-declaration.png', {
      fullPage: true,
      mask: [plantsPages.declaration.content.dateValue],
    });
  });
});
