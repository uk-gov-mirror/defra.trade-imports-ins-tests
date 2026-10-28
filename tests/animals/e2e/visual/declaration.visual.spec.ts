import { test, expect } from '@fixtures/visual';

test.use({ headless: true });

test.describe('Declaration (visual regression)', { tag: '@visual' }, () => {
  test.beforeEach(async ({ animalsSeededJourney, animalsJourney }) => {
    await animalsSeededJourney.createDraftNotification();
    await animalsJourney.toDeclarationOfCurrentNotification();
  });

  test('shows the declaration statements, the small confirmation checkbox and no visible legend', async ({ page, animalsPages }) => {
    await expect(page).toHaveScreenshot('declaration.png', {
      fullPage: true,
      mask: [animalsPages.declaration.content.dateValue],
    });
  });
});
