import { commodityLines } from '@domain/animals/constants/commodity-lines';

import { test, expect } from '@fixtures';

test.describe('Additional details scope', { tag: '@duplicated-in-frontend' }, () => {
  test('the unweaned-animals question shows only when a triggering commodity line exists', async ({
    animalsJourney,
    animalsPages,
    pages,
  }) => {
    test.slow();

    await animalsJourney.startNotification();

    const unweaned = pages.page.getByRole('group', {
      name: 'Does the consignment contain any unweaned animals?',
    });

    await animalsJourney.addCommodityToCurrentNotification(commodityLines.domesticCat);
    await animalsJourney.toAdditionalDetailsOfCurrentNotification();
    await expect(animalsPages.additionalDetails.certificationQuestion).toBeVisible();
    await expect(unweaned).toBeHidden();

    await animalsJourney.addCommodityToCurrentNotification(commodityLines.cattle);
    await animalsJourney.toAdditionalDetailsOfCurrentNotification();
    await expect(animalsPages.additionalDetails.certificationQuestion).toBeVisible();
    await expect(unweaned).toBeVisible();
  });

  test('a saved unweaned-animals answer is cleared when the commodities change to ones the question is not asked for', async ({
    animalsJourney,
    animalsPages,
  }) => {
    test.slow();

    await animalsJourney.startNotification();
    await animalsJourney.addCommodityToCurrentNotification(commodityLines.cattle);
    await animalsJourney.toAdditionalDetailsOfCurrentNotification();
    await animalsPages.additionalDetails.certifiedFor('Slaughter').check();
    await animalsPages.additionalDetails.containsUnweanedAnimals('Yes').check();
    await animalsPages.additionalDetails.saveAndContinue.click();
    await animalsPages.overview.heading.waitFor();

    await animalsPages.overview.task('What are you importing?').click();
    await animalsPages.commoditySelection.clearAll.click();
    await animalsPages.commoditySelection.searchAndCheckSpecies([commodityLines.domesticCat]);
    await animalsPages.commoditySelection.saveAndContinue.click();
    await animalsPages.overview.heading.waitFor();
    await animalsPages.overview.reviewAndSubmitButton.click();

    const additionalAnimalDetails = animalsPages.notificationView.summaryCard('Additional animal details');
    await expect(additionalAnimalDetails.getByRole('term')).toHaveText(['Certified for']);

    await animalsJourney.addCommodityToCurrentNotification(commodityLines.cattle);
    await animalsJourney.toAdditionalDetailsOfCurrentNotification();
    await expect(animalsPages.additionalDetails.containsUnweanedAnimals('Yes')).not.toBeChecked();
    await expect(animalsPages.additionalDetails.containsUnweanedAnimals('No')).not.toBeChecked();
  });
});
