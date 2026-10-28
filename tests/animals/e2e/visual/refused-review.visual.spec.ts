import { test, expect } from '@fixtures/visual';

test.use({ headless: true });

test.describe('Refused review (visual regression)', { tag: '@visual' }, () => {
  test.beforeEach(async ({ animalsSeededJourney, animalsNotificationActions, animalsPages, page, journeyContext }) => {
    await animalsSeededJourney.createDraftNotification('unlocked');
    await animalsNotificationActions.toNotificationView(journeyContext.referenceNumber);
    await animalsPages.notificationView.continueButton.click();
    await expect(page).toHaveURL(/\/notification-view\?refused=1$/);
  });

  test('shows the unfinished card with its red left border and Complete line at desktop width', async ({ page, animalsPages }) => {
    await expect(page).toHaveScreenshot('refused-review-desktop.png', {
      fullPage: true,
      mask: [animalsPages.notificationView.journeyStrip],
    });
  });

  test('shows the unfinished card with its red left border and Complete line at phone width', async ({ page, animalsPages }) => {
    await page.setViewportSize({ width: 360, height: 740 });

    await expect(page).toHaveScreenshot('refused-review-phone.png', {
      fullPage: true,
      mask: [animalsPages.notificationView.journeyStrip],
    });
  });
});
