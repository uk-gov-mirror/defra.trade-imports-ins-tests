import { test, expect } from '@fixtures';

test.describe('Task-page exits', { tag: '@duplicated-in-frontend' }, () => {
  test('Cancel and return to overview discards typed input; Save and return to overview commits and lands on the hub', async ({
    animalsJourney,
    animalsPages,
  }) => {
    await animalsJourney.startNotification();

    await animalsPages.overview.task('Where is this consignment coming from?').click();
    await animalsPages.originOfImport.internalReference.fill('DiscardedRef');
    await animalsPages.originOfImport.cancelAndReturnToOverview.click();
    await expect(animalsPages.overview.heading).toBeVisible();

    await animalsPages.overview.task('Where is this consignment coming from?').click();
    await expect(animalsPages.originOfImport.internalReference).toHaveValue('');

    await animalsJourney.fillOriginOfImport({ internalReference: 'CommittedRef' });
    await animalsPages.originOfImport.saveAndReturnToOverview.click();
    await expect(animalsPages.overview.heading).toBeVisible();

    await animalsPages.overview.task('Where is this consignment coming from?').click();
    await expect(animalsPages.originOfImport.internalReference).toHaveValue('CommittedRef');
  });
});
