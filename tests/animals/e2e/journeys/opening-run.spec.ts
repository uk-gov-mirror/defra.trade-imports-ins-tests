import { commoditySpecies } from '@domain/animals/constants/commodity-species';
import { MANDATORY_ANSWERS } from '@domain/animals/constants/journey-options';
import { SET_BASES } from '@page-objects/shared/sets';
import { OPENING_RUN_TASKS, certificateDocument } from '@flows/animals/journey';

import { test, expect } from '@fixtures';

test.describe('Opening run', () => {
  test('walks a cattle-by-air notification through every opening-run task, from create to submitted', async ({
    animalsJourney,
    animalsPages,
    pages,
  }) => {
    test.slow();

    const referenceNumber = await animalsJourney.walkOpeningRunCattleByAir(certificateDocument('AWBDOC'));
    await expect(pages.page).toHaveURL(new RegExp(`${SET_BASES.liveAnimals}/notifications/${referenceNumber}/notification-view$`));

    await animalsPages.overview.open(referenceNumber);
    await expect(animalsPages.overview.taskNames).toHaveText(OPENING_RUN_TASKS);
    await expect(animalsPages.overview.taskStatuses).toHaveText(OPENING_RUN_TASKS.map(() => 'Complete'));
    await animalsPages.overview.reviewAndSubmitButton.click();
    await expect(animalsPages.notificationView.heading).toBeVisible();

    const importDetails = animalsPages.notificationView.summaryCard('Import details');
    await expect(animalsPages.notificationView.regionOfOriginCode).toHaveText('FR-75');
    await expect(animalsPages.notificationView.summaryValue(importDetails, 'Internal reference number')).toHaveText('CATTLE-2026-01');

    const speciesCard = animalsPages.notificationView.speciesCard(commoditySpecies.cattle);
    await expect(animalsPages.notificationView.summaryValue(speciesCard, 'Species')).toHaveText(commoditySpecies.cattle.latinName);
    await expect(animalsPages.notificationView.summaryValue(speciesCard, 'Number of animals')).toHaveText('2');

    const reasonForImport = animalsPages.notificationView.summaryCard('Reason for import');
    await expect(animalsPages.notificationView.summaryValue(reasonForImport, 'Reason for import')).toHaveText('Internal market');
    await expect(animalsPages.notificationView.summaryValue(reasonForImport, 'Purpose in the market')).toHaveText('Breeding');

    const additionalAnimalDetails = animalsPages.notificationView.summaryCard('Additional animal details');
    await expect(animalsPages.notificationView.summaryValue(additionalAnimalDetails, 'Certified for')).toHaveText('Further keeping');

    const transportDetails = animalsPages.notificationView.summaryCard('Transport details');
    await expect(animalsPages.notificationView.summaryValue(transportDetails, 'Name')).toContainText('García Livestock Transport SL');

    const rolesAndAddresses = animalsPages.notificationView.summaryCard('Roles and addresses');
    await expect(animalsPages.notificationView.summaryValue(rolesAndAddresses, 'County parish holding (CPH) number')).toHaveText(
      '123456789',
    );

    await animalsJourney.submitFromReview();
    await expect(pages.page.getByRole('heading', { name: 'Import notification submitted' })).toBeVisible();
  });

  test('following Back from the main import reason and choosing Save and continue carries the run on to the main import reason, not the overview', async ({
    animalsJourney,
    animalsPages,
  }) => {
    await animalsJourney.toOriginOfImport();
    await animalsJourney.fillOriginOfImport();
    await animalsJourney.saveOriginOfImport();
    await expect(animalsPages.commoditySelection.heading).toBeVisible();
    await animalsPages.commoditySelection.searchAndCheckSpecies([MANDATORY_ANSWERS.commodityLines[0].species]);
    await animalsPages.commoditySelection.saveAndContinue.click();
    await expect(animalsPages.importReason.heading).toBeVisible();

    await animalsPages.importReason.linkBack.click();
    await expect(animalsPages.commoditySelection.heading).toBeVisible();

    await animalsPages.commoditySelection.saveAndContinue.click();
    await expect(animalsPages.importReason.heading).toBeVisible();
  });

  test('ends the opening run on the review page, naming what is outstanding, when the notification is incomplete', async ({
    animalsJourney,
    animalsPages,
    pages,
  }) => {
    test.slow();

    const referenceNumber = await animalsJourney.walkOpeningRunToRolesAndAddressesWithoutCph();

    await animalsPages.addresses.continueButton.click();
    await expect(animalsPages.contactAddress.heading).toBeVisible();
    await expect(animalsPages.cphNumber.heading).toBeHidden();
    await expect(pages.page).toHaveURL(new RegExp(`${SET_BASES.liveAnimals}/notifications/${referenceNumber}/consignment/contact/select`));

    await animalsPages.contactAddress.address('Animal and Plant Health Agency').check();
    await animalsPages.contactAddress.saveAndContinue.click();

    await expect(animalsPages.notificationView.heading).toBeVisible();
    await expect(pages.page).toHaveURL(new RegExp(`${SET_BASES.liveAnimals}/notifications/${referenceNumber}/notification-view$`));
    await expect(animalsPages.notificationView.errorSummary).toContainText('Complete reason for import');
    await expect(animalsPages.notificationView.errorSummary).toContainText('Complete roles and addresses');

    await animalsPages.notificationView.continueButton.click();
    await expect(animalsPages.notificationView.heading).toBeVisible();
    await expect(animalsPages.notificationView.errorSummary).toBeFocused();
  });
});
