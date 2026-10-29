import { test, expect } from '@fixtures';
import { fileUploadPaths } from '@resources/file-upload/paths';
import { DOCUMENT_ISSUE_DATE } from '@resources/file-upload/constants';
import { timeouts } from '@config/timeouts';

for (const [mode, javaScriptEnabled] of [
  ['with JavaScript', true],
  ['without JavaScript', false],
] as const) {
  test.describe(`Upload documents reached again through the browser history ${mode}`, () => {
    test.use({ javaScriptEnabled });

    test('adds a second document after the browser back button returns to the page', async ({ animalsJourney, animalsPages, pages }) => {
      test.slow();
      await animalsJourney.toAccompanyingDocuments();
      const firstReference = `PWBACKA${Date.now()}`;
      const secondReference = `PWBACKB${Date.now()}`;

      const addControl = animalsPages.accompanyingDocuments.saveAndAddAnother;

      await animalsPages.accompanyingDocuments.fillDocument(firstReference, DOCUMENT_ISSUE_DATE, fileUploadPaths.safeFile1kbPdf);
      const uploadPathOnFirstVisit = await addControl.getAttribute('formaction');
      await animalsPages.accompanyingDocuments.saveAndReturnToOverview.click();
      await expect(animalsPages.overview.heading).toBeVisible();

      await pages.page.goBack();
      await expect(animalsPages.accompanyingDocuments.heading).toBeVisible();
      await expect.poll(() => addControl.getAttribute('formaction'), { timeout: timeouts.long }).not.toBe(uploadPathOnFirstVisit);
      await animalsPages.accompanyingDocuments.fillDocument(secondReference, DOCUMENT_ISSUE_DATE, fileUploadPaths.safeFile1kbPdf);
      await addControl.click();

      await expect(animalsPages.accompanyingDocuments.heading).toBeVisible();
      await expect(animalsPages.accompanyingDocuments.documentRow(firstReference)).toBeVisible();
      await expect(animalsPages.accompanyingDocuments.documentRow(secondReference)).toBeVisible();
      await expect(animalsPages.accompanyingDocuments.addedDocumentRows).toHaveCount(2);
    });
  });
}
