import { test, expect } from '@fixtures';
import type { AnimalsPages } from '@page-objects';
import { EMPTY_DOCUMENT_LIST_CARD_TEXT } from '@page-objects/animals/accompanying-documents-page';
import { fileUploadPaths } from '@resources/file-upload/paths';
import { DOCUMENT_ISSUE_DATE } from '@resources/file-upload/constants';

const TYPE_REQUIRED_ERROR = 'Select a document type';
const DATE_REQUIRED_ERROR = 'Enter a date of issue';
const FILE_REQUIRED_ERROR = 'Upload a document';

const saveButtons = [
  ['Save and add another', (animalsPages: AnimalsPages) => animalsPages.accompanyingDocuments.saveAndAddAnother],
  ['Save and continue', (animalsPages: AnimalsPages) => animalsPages.accompanyingDocuments.saveAndContinue],
  ['Save and return to overview', (animalsPages: AnimalsPages) => animalsPages.accompanyingDocuments.saveAndReturnToOverview],
] as const;

for (const [mode, javaScriptEnabled] of [
  ['with JavaScript', true],
  ['without JavaScript', false],
] as const) {
  test.describe(`Upload documents save buttons ${mode}`, () => {
    test.use({ javaScriptEnabled });

    for (const [buttonName, saveButton] of saveButtons) {
      test(`${buttonName}: a part-filled document stays on the page with an error for each detail not given, keeps the typed reference and adds no document`, async ({
        animalsJourney,
        animalsPages,
      }) => {
        await animalsJourney.toAccompanyingDocuments();
        const reference = `PWPART${Date.now()}`;
        await animalsPages.accompanyingDocuments.documentReference.fill(reference);

        await saveButton(animalsPages).click();

        await expect(animalsPages.accompanyingDocuments.heading).toBeVisible();
        await expect(animalsPages.accompanyingDocuments.errorSummaryLinks).toHaveText([
          TYPE_REQUIRED_ERROR,
          DATE_REQUIRED_ERROR,
          FILE_REQUIRED_ERROR,
        ]);
        await expect(animalsPages.accompanyingDocuments.documentReference).toHaveValue(reference);
        await expect(animalsPages.accompanyingDocuments.addedDocumentsTable).toHaveCount(0);
        await expect(animalsPages.accompanyingDocuments.fileUploadCard).toHaveText(EMPTY_DOCUMENT_LIST_CARD_TEXT);
      });
    }

    test('Save and continue: a reference, date of issue and attachment with no document type shows "Select a document type" and adds no document', async ({
      animalsJourney,
      animalsPages,
    }) => {
      const NO_DOCUMENT_TYPE = '';
      const reference = `PWNOTYPE${Date.now()}`;
      await animalsJourney.toAccompanyingDocuments();
      await animalsPages.accompanyingDocuments.fillDocument(
        reference,
        DOCUMENT_ISSUE_DATE,
        fileUploadPaths.safeFile1kbPdf,
        NO_DOCUMENT_TYPE,
      );

      await animalsPages.accompanyingDocuments.saveAndContinue.click();

      await expect(animalsPages.accompanyingDocuments.heading).toBeVisible();
      await expect(animalsPages.accompanyingDocuments.errorSummaryLinks).toHaveText([TYPE_REQUIRED_ERROR]);
      await expect(animalsPages.accompanyingDocuments.documentReference).toHaveValue(reference);
      await expect(animalsPages.accompanyingDocuments.dateOfIssue).toHaveValue(DOCUMENT_ISSUE_DATE);
      await expect(animalsPages.accompanyingDocuments.addedDocumentsTable).toHaveCount(0);
    });

    test('Save and return to overview: a document with every detail filled in shows Overview, and reopening Upload documents lists it', async ({
      animalsJourney,
      animalsPages,
    }) => {
      test.slow();
      await animalsJourney.toAccompanyingDocuments();
      const reference = `PWRETURN${Date.now()}`;
      await animalsPages.accompanyingDocuments.fillDocument(reference, DOCUMENT_ISSUE_DATE, fileUploadPaths.safeFile1kbPdf);

      await animalsPages.accompanyingDocuments.saveAndReturnToOverview.click();

      await expect(animalsPages.overview.heading).toBeVisible();
      await animalsPages.overview.task('Upload documents').click();
      await expect(animalsPages.accompanyingDocuments.documentRow(reference)).toBeVisible();
    });

    test('Save and return to overview: an untouched form shows Overview and adds no document', async ({ animalsJourney, animalsPages }) => {
      await animalsJourney.toAccompanyingDocuments();

      await animalsPages.accompanyingDocuments.saveAndReturnToOverview.click();

      await expect(animalsPages.overview.heading).toBeVisible();
      await animalsPages.overview.task('Upload documents').click();
      await expect(animalsPages.accompanyingDocuments.addedDocumentsTable).toHaveCount(0);
    });

    test('Save and continue: an untouched form shows Overview and adds no document', async ({ animalsJourney, animalsPages }) => {
      await animalsJourney.toAccompanyingDocuments();

      await animalsPages.accompanyingDocuments.saveAndContinue.click();

      await expect(animalsPages.overview.heading).toBeVisible();
      await animalsPages.overview.task('Upload documents').click();
      await expect(animalsPages.accompanyingDocuments.addedDocumentsTable).toHaveCount(0);
    });
  });
}
