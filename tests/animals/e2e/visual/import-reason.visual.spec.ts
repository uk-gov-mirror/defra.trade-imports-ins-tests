import { test, expect } from '@fixtures/visual';

test.use({ headless: true });

test.describe('Import reason (visual regression)', { tag: '@visual' }, () => {
  test.beforeEach(async ({ animalsJourney }) => {
    await animalsJourney.toImportReason();
  });

  test('shows the transhipment destination country search', async ({ page, animalsPages }) => {
    await animalsPages.importReason.reason('Transhipment or onward travel').check();

    await expect(page).toHaveScreenshot('import-reason-transhipment.png', {
      fullPage: true,
      mask: [animalsPages.importReason.journeyStrip],
    });
  });

  test('shows the transit port of exit and destination country searches', async ({ page, animalsPages }) => {
    await animalsPages.importReason.reason('Transit').check();

    await expect(page).toHaveScreenshot('import-reason-transit.png', {
      fullPage: true,
      mask: [animalsPages.importReason.journeyStrip],
    });
  });

  test('shows the temporary admission exit date and port of exit search', async ({ page, animalsPages }) => {
    await animalsPages.importReason.reason('Temporary admission horses').check();

    await expect(page).toHaveScreenshot('import-reason-temporary-admission.png', {
      fullPage: true,
      mask: [animalsPages.importReason.journeyStrip],
    });
  });

  test('shows the temporary admission exit date error with the gap kept above the port of exit', async ({ page, animalsPages }) => {
    await animalsPages.importReason.reason('Temporary admission horses').check();
    await animalsPages.importReason.saveAndContinue.click();
    await expect(animalsPages.importReason.errorSummary).toBeVisible();

    await expect(page).toHaveScreenshot('import-reason-temporary-admission-error.png', {
      fullPage: true,
      mask: [animalsPages.importReason.journeyStrip],
    });
  });
});

test.describe('Import reason without JavaScript (visual regression)', { tag: '@visual' }, () => {
  test.use({ javaScriptEnabled: false });

  test('shows the temporary admission exit date and port of exit select', async ({ page, animalsJourney, animalsPages }) => {
    await animalsJourney.toImportReason();
    await animalsPages.importReason.reason('Temporary admission horses').check();

    await expect(page).toHaveScreenshot('import-reason-temporary-admission-no-javascript.png', {
      fullPage: true,
      mask: [animalsPages.importReason.journeyStrip],
    });
  });
});
