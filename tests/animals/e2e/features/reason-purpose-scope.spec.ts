import { test, expect } from '@fixtures';
import { IMPORT_REASON_TASK } from '@domain/animals/constants/import-reason-page';

test.describe('Reason and purpose scope', { tag: '@duplicated-in-frontend' }, () => {
  test('purpose is owed only for the internal market and is wiped when the reason changes', async ({
    animalsJourney,
    pages,
    animalsPages,
  }) => {
    await animalsJourney.startNotification();
    await animalsJourney.answerCommodity();

    const reasonRow = pages.page.locator('.govuk-task-list__item', { hasText: IMPORT_REASON_TASK });

    await animalsPages.overview.task(IMPORT_REASON_TASK).click();
    await animalsPages.importReason.reason('Internal market').check();
    await animalsPages.importReason.purpose('Breeding').check();
    await animalsPages.importReason.saveAndContinue.click();
    await expect(animalsPages.overview.heading).toBeVisible();
    await animalsPages.overview.task('Additional details').click();
    await expect(animalsPages.additionalDetails.heading).toBeVisible();
    await animalsPages.additionalDetails.certifiedFor('Slaughter').check();
    await animalsPages.additionalDetails.saveAndContinue.click();
    await expect(reasonRow).toContainText('Complete');

    await animalsPages.overview.task(IMPORT_REASON_TASK).click();
    await animalsPages.importReason.reason('Transit').check();
    await animalsPages.importReason.selectTransitPortOfExitByIndex(2);
    await animalsPages.importReason.selectTransitDestinationCountry('FR');
    await animalsPages.importReason.saveAndContinue.click();
    await expect(animalsPages.overview.heading).toBeVisible();
    await animalsPages.overview.task('Additional details').click();
    await expect(animalsPages.additionalDetails.heading).toBeVisible();
    await animalsPages.additionalDetails.saveAndContinue.click();
    await expect(animalsPages.overview.heading).toBeVisible();
    await expect(reasonRow).toContainText('Complete');

    await animalsPages.overview.task(IMPORT_REASON_TASK).click();
    await animalsPages.importReason.reason('Internal market').check();
    await expect(pages.page.locator('input[name="purposeInInternalMarket"]:checked')).toHaveCount(0);

    await animalsPages.importReason.saveAndContinue.click();
    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toBeVisible();
    await expect(pages.page.getByRole('link', { name: 'Select a purpose in the internal market' })).toBeVisible();
    await expect(animalsPages.importReason.heading).toBeVisible();

    await animalsPages.importReason.reason('Internal market').check();
    await animalsPages.importReason.purpose('Breeding').check();
    await animalsPages.importReason.saveAndContinue.click();
    await expect(animalsPages.overview.heading).toBeVisible();
    await animalsPages.overview.task('Additional details').click();
    await expect(animalsPages.additionalDetails.heading).toBeVisible();
    await animalsPages.additionalDetails.saveAndContinue.click();
    await expect(animalsPages.overview.heading).toBeVisible();
    await expect(reasonRow).toContainText('Complete');
  });
});
