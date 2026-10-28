import { test, expect } from '@fixtures';
import { OFFERED_DOCUMENT_TYPE_LABELS, DOCUMENT_TYPE_SELECT_TEXT } from '@domain/animals/constants/document-types';

test.describe('Documents entry flow', { tag: '@duplicated-in-frontend' }, () => {
  test('opens the upload documents page from Overview with only the origin answered', async ({ animalsJourney, animalsPages }) => {
    await animalsJourney.startNotification();
    await animalsPages.overview.task('Upload documents').click();

    await expect(animalsPages.accompanyingDocuments.heading).toBeVisible();
  });

  test('the document type select opens on Select one, then offers thirteen document types in order', async ({
    animalsJourney,
    animalsPages,
  }) => {
    await animalsJourney.toAccompanyingDocuments();

    await expect(animalsPages.accompanyingDocuments.documentType).toHaveValue('');
    await expect(animalsPages.accompanyingDocuments.documentTypeOptions).toHaveText([
      DOCUMENT_TYPE_SELECT_TEXT,
      ...OFFERED_DOCUMENT_TYPE_LABELS,
    ]);
  });
});
