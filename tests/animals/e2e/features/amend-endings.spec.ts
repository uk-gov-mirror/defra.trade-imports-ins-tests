import { test, expect } from '@fixtures';

const ARRIVAL_DETAILS_TASK = 'Arrival details';
const UPLOAD_DOCUMENTS_TASK = 'Upload documents';
const CHANGE_IMPORT_DETAILS = 'Change import details';
const AMENDED_REFERENCE = 'AMENDED-REF';
const AMEND = 'Amend';

test.describe('Amendment page endings', () => {
  test('a page opened from Overview while amending ends with Save and return and Save and continue, then Save and return to overview on its own line, with no cancel link, and Back goes to Overview', async ({
    animalsPages,
    animalsSeededJourney,
  }) => {
    const reference = await animalsSeededJourney.createAmendNotification();
    await animalsPages.overview.open(reference);
    await animalsPages.overview.task(ARRIVAL_DETAILS_TASK).click();
    await expect(animalsPages.arrivalDetails.heading).toBeVisible();

    const { arrivalDetails } = animalsPages;
    await expect(arrivalDetails.buttonGroup.filter({ has: arrivalDetails.saveAndReturn })).toBeVisible();
    await expect(arrivalDetails.buttonGroup.filter({ has: arrivalDetails.saveAndContinue })).toBeVisible();
    await expect(arrivalDetails.buttonGroup.getByRole('button')).toHaveCount(2);
    await expect(animalsPages.arrivalDetails.saveAndReturnToOverview).toBeVisible();
    await expect(animalsPages.arrivalDetails.cancelAndReturnToOverview).toHaveCount(0);
    await expect(animalsPages.arrivalDetails.cancelAmend).toBeVisible();
    await expect(animalsPages.arrivalDetails.linkBack).toHaveAttribute('href', animalsPages.overview.expectedUrl(reference));

    await animalsPages.arrivalDetails.saveAndReturnToOverview.click();
    await expect(animalsPages.overview.heading).toBeVisible();
  });

  test('Upload documents opened from Overview while amending has a Back link to the review', async ({
    animalsPages,
    animalsSeededJourney,
  }) => {
    const reference = await animalsSeededJourney.createAmendNotification();
    await animalsPages.overview.open(reference);
    await animalsPages.overview.task(UPLOAD_DOCUMENTS_TASK).click();
    await expect(animalsPages.accompanyingDocuments.heading).toBeVisible();

    await expect(animalsPages.accompanyingDocuments.linkBack).toHaveAttribute('href', animalsPages.notificationView.expectedUrl(reference));

    await animalsPages.accompanyingDocuments.linkBack.click();
    await expect(animalsPages.notificationView.heading).toBeVisible();
  });

  test('Save and return from a Change link goes back to the amend review showing the changed answer', async ({
    pages,
    animalsPages,
    animalsSeededJourney,
  }) => {
    const reference = await animalsSeededJourney.createAmendNotification();
    await animalsPages.notificationView.open(reference);
    await animalsPages.notificationView.changeLink(CHANGE_IMPORT_DETAILS).click();
    await expect(animalsPages.originOfImport.heading).toBeVisible();

    await expect(pages.page).toHaveURL(/\/origin\?change=1$/);
    await expect(animalsPages.originOfImport.linkBack).toHaveAttribute('href', animalsPages.overview.expectedUrl(reference));

    await animalsPages.originOfImport.internalReference.fill(AMENDED_REFERENCE);
    await animalsPages.originOfImport.saveAndReturn.click();

    await expect(pages.page).toHaveURL(/\/notification-view$/);
    const importDetails = animalsPages.notificationView.summaryCard('Import details');
    await expect(animalsPages.notificationView.summaryValue(importDetails, 'Internal reference number')).toHaveText(AMENDED_REFERENCE);
  });

  test('Save and continue while amending goes on as it does outside an amendment, not back to the review', async ({
    pages,
    animalsPages,
    animalsSeededJourney,
  }) => {
    const reference = await animalsSeededJourney.createAmendNotification();
    await animalsPages.notificationView.open(reference);
    await animalsPages.notificationView.changeLink(CHANGE_IMPORT_DETAILS).click();
    await expect(animalsPages.originOfImport.heading).toBeVisible();

    await animalsPages.originOfImport.saveAndContinue.click();

    await expect(animalsPages.overview.heading).toBeVisible();
    await expect(pages.page).not.toHaveURL(/\/notification-view/);
  });

  test('the CPH number page, a party picker and the contact address page end with Save and return and Save and continue only, and Save and return goes to the amend review', async ({
    animalsPages,
    animalsSeededJourney,
  }) => {
    const reference = await animalsSeededJourney.createAmendNotification();

    await animalsPages.cphNumber.open(reference);
    await expect(animalsPages.cphNumber.heading).toBeVisible();
    await expect(animalsPages.cphNumber.saveAndReturn).toBeVisible();
    await expect(animalsPages.cphNumber.saveAndContinue).toBeVisible();
    await expect(animalsPages.cphNumber.saveAndReturnToOverview).toHaveCount(0);
    await animalsPages.cphNumber.saveAndReturn.click();
    await expect(animalsPages.notificationView.heading).toBeVisible();

    await animalsPages.placeOfOriginSelection.open(reference);
    await expect(animalsPages.placeOfOriginSelection.saveAndReturn).toBeVisible();
    await expect(animalsPages.placeOfOriginSelection.saveAndContinue).toBeVisible();
    await expect(animalsPages.placeOfOriginSelection.saveAndReturnToOverview).toHaveCount(0);
    await animalsPages.placeOfOriginSelection.saveAndReturn.click();
    await expect(animalsPages.notificationView.heading).toBeVisible();

    await animalsPages.contactAddress.open(reference);
    await expect(animalsPages.contactAddress.heading).toBeVisible();
    await expect(animalsPages.contactAddress.saveAndReturn).toBeVisible();
    await expect(animalsPages.contactAddress.saveAndContinue).toBeVisible();
    await expect(animalsPages.contactAddress.saveAndReturnToOverview).toHaveCount(0);
    await animalsPages.contactAddress.saveAndReturn.click();
    await expect(animalsPages.notificationView.heading).toBeVisible();
  });

  test('outside an amendment the CPH number page keeps its single primary button', async ({ animalsPages, animalsSeededJourney }) => {
    const reference = await animalsSeededJourney.createDraftNotification();

    await animalsPages.cphNumber.open(reference);
    await expect(animalsPages.cphNumber.saveAndContinue).toBeVisible();
    await expect(animalsPages.cphNumber.saveAndReturn).toHaveCount(0);
    await expect(animalsPages.cphNumber.saveAndReturnToOverview).toHaveCount(0);

    await animalsPages.originOfImport.open(reference);
    await expect(animalsPages.originOfImport.saveAndReturn).toHaveCount(0);
    await expect(animalsPages.originOfImport.cancelAndReturnToOverview).toBeVisible();
  });

  test('Continue on an amend review with an answer missing stays on the review and shows There is a problem, naming what is missing', async ({
    pages,
    animalsPages,
    animalsSeededJourney,
  }) => {
    const reference = await animalsSeededJourney.createAmendNotification();
    await animalsPages.arrivalDetails.open(reference);
    await animalsPages.arrivalDetails.arrivalDate.fill('');
    await animalsPages.arrivalDetails.saveAndReturnToOverview.click();
    await expect(animalsPages.overview.heading).toBeVisible();

    await animalsPages.notificationView.open(reference);
    await expect(animalsPages.notificationView.errorSummary).toHaveCount(0);

    await animalsPages.notificationView.continueButton.click();

    await expect(pages.page).toHaveURL(/\/notification-view\?refused=1$/);
    await expect(animalsPages.notificationView.errorSummary).toBeVisible();
    await expect(animalsPages.notificationView.errorSummary).toContainText('There is a problem');
    await expect(animalsPages.notificationView.errorSummary.getByRole('link', { name: 'Complete arrival details' })).toBeVisible();
    await expect(animalsPages.notificationView.statusTag).toHaveText(AMEND);
    await expect(animalsPages.declaration.heading).not.toBeVisible();
  });
});
