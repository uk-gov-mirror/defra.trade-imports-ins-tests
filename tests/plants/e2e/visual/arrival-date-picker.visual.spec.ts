import { test, expect } from '@fixtures/visual';
import { freezeDatePickersAt } from '@utils/frozen-date-picker';

test.use({ headless: true });

test.describe('Plants arrival date picker (visual regression)', { tag: '@visual' }, () => {
  test('shows the calendar opened with the mouse on a potato notification', async ({ page, plantsJourney, plantsPages }) => {
    await freezeDatePickersAt(page, '2026-03-18');
    await plantsJourney.toArrivalDetailsOfNewPotatoNotification();
    const picker = plantsPages.arrivalDetails.arrivalDatePicker;

    await picker.open();
    await expect(picker.dialog).toBeVisible();

    await expect(picker.dialog).toHaveScreenshot('plants-arrival-date-picker-calendar-mouse.png');
  });
});
