import { test, expect } from '@fixtures/visual';
import { freezeDatePickersAt } from '@utils/frozen-date-picker';

test.use({ headless: true });

test.describe('Arrival date picker (visual regression)', { tag: '@visual' }, () => {
  test.beforeEach(async ({ page, animalsJourney }) => {
    await freezeDatePickersAt(page, '2026-03-18');
    await animalsJourney.toArrivalDetails();
  });

  test('shows the Choose date button at rest', async ({ animalsPages }) => {
    const picker = animalsPages.arrivalDetails.arrivalDatePicker;
    await expect(picker.toggle).toBeVisible();

    await expect(picker.root).toHaveScreenshot('arrival-date-picker-button-at-rest.png');
  });

  test('shows the Choose date button under the mouse', async ({ animalsPages }) => {
    const picker = animalsPages.arrivalDetails.arrivalDatePicker;
    await picker.toggle.hover();

    await expect(picker.root).toHaveScreenshot('arrival-date-picker-button-hover.png');
  });

  test('shows the Choose date button with keyboard focus', async ({ animalsPages }) => {
    const picker = animalsPages.arrivalDetails.arrivalDatePicker;
    await picker.focusToggleByKeyboard();
    await expect(picker.toggle).toBeFocused();

    await expect(picker.root).toHaveScreenshot('arrival-date-picker-button-focus.png');
  });

  test('shows the calendar opened with the mouse', async ({ animalsPages }) => {
    const picker = animalsPages.arrivalDetails.arrivalDatePicker;
    await picker.open();
    await expect(picker.dialog).toBeVisible();

    await expect(picker.dialog).toHaveScreenshot('arrival-date-picker-calendar-mouse.png');
  });

  test('shows the calendar opened with the keyboard', async ({ animalsPages }) => {
    const picker = animalsPages.arrivalDetails.arrivalDatePicker;
    await picker.openByKeyboard();
    await expect(picker.dialog).toBeVisible();

    await expect(picker.dialog).toHaveScreenshot('arrival-date-picker-calendar-keyboard.png');
  });
});
