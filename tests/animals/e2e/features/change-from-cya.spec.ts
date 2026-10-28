import { test, expect } from '@fixtures';
import { fileUploadPaths } from '@resources/file-upload/paths';
import { DOCUMENT_ISSUE_DATE } from '@resources/file-upload/constants';

test.describe('Change from check your answers', { tag: '@duplicated-in-frontend' }, () => {
  test('a Change link opens the answering page with change context and the save returns to check your answers with the new value', async ({
    animalsSeededJourney,
    pages,
    animalsPages,
  }) => {
    test.slow();
    const referenceNumber = await animalsSeededJourney.createDraftNotification();
    await animalsSeededJourney.resumeInUi(referenceNumber, animalsPages.notificationView);

    const countryRow = pages.page.locator('.govuk-summary-list__row', { hasText: 'Country of origin' });
    await expect(countryRow).toContainText('France');
    await animalsPages.notificationView.changeLink('Change import details').click();
    await expect(animalsPages.originOfImport.heading).toBeVisible();
    await expect(pages.page).toHaveURL(/\/origin\?change=1$/);
    await animalsPages.originOfImport.country.choose('Belgium');
    await animalsPages.originOfImport.saveAndContinue.click();
    await expect(animalsPages.notificationView.heading).toBeVisible();
    await expect(pages.page).toHaveURL(/\/notification-view$/);
    await expect(countryRow).toContainText('Belgium');

    const certifiedForRow = pages.page.locator('.govuk-summary-list__row', { hasText: 'Certified for' });
    await expect(certifiedForRow).toContainText('Slaughter');
    await animalsPages.notificationView.changeLink('Change additional animal details').click();
    await expect(animalsPages.additionalDetails.heading).toBeVisible();
    await expect(pages.page).toHaveURL(/\/additional-details\?change=1$/);
    await animalsPages.additionalDetails.certifiedFor('Exhibition').check();
    await animalsPages.additionalDetails.saveAndContinue.click();
    await expect(animalsPages.notificationView.heading).toBeVisible();
    await expect(pages.page).toHaveURL(/\/notification-view$/);
    await expect(certifiedForRow).toContainText('Exhibition');
  });

  test('the documents Change link opens the page with a Back link to the review, which stays after a refusal, after Save and add another and after Remove', async ({
    animalsSeededJourney,
    pages,
    animalsPages,
  }) => {
    test.slow();
    const referenceNumber = await animalsSeededJourney.createDraftNotification();
    await animalsSeededJourney.resumeInUi(referenceNumber, animalsPages.notificationView);
    const reviewUrl = animalsPages.notificationView.expectedUrl(referenceNumber);

    await animalsPages.notificationView.changeLink('Change uploaded documents').click();
    await expect(animalsPages.accompanyingDocuments.heading).toBeVisible();
    await expect(pages.page).toHaveURL(/\/accompanying-documents\?change=1$/);
    await expect(animalsPages.accompanyingDocuments.linkBack).toHaveAttribute('href', reviewUrl);

    await animalsPages.accompanyingDocuments.documentReference.fill('GBHC1234567890');
    await animalsPages.accompanyingDocuments.saveAndAddAnother.click();

    await expect(animalsPages.accompanyingDocuments.errorSummary).toContainText('Upload a document');
    await expect(animalsPages.accompanyingDocuments.linkBack).toHaveAttribute('href', reviewUrl);

    const reference = `GBHC${Date.now()}`;
    await animalsPages.accompanyingDocuments.fillDocument(reference, DOCUMENT_ISSUE_DATE, fileUploadPaths.safeFile1kbPdf);
    await animalsPages.accompanyingDocuments.saveAndAddAnother.click();
    await expect(animalsPages.accompanyingDocuments.documentRow(reference)).toBeVisible();
    await expect(animalsPages.accompanyingDocuments.linkBack).toHaveAttribute('href', reviewUrl);

    await animalsPages.accompanyingDocuments.removeDocument(1).click();
    await expect(animalsPages.accompanyingDocuments.linkBack).toHaveAttribute('href', reviewUrl);

    await animalsPages.accompanyingDocuments.linkBack.click();
    await expect(animalsPages.notificationView.heading).toBeVisible();
  });
});
