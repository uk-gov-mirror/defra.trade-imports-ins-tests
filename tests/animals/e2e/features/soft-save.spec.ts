import { test, expect } from '@fixtures';
import { IMPORT_REASON_TASK } from '@domain/animals/constants/import-reason-page';
import { SELECT_COMMODITY_ERROR } from '@domain/animals/constants/commodity-selection-page';
import { countryCodes } from '@domain/animals/constants/country-codes';
import { MANDATORY_ANSWERS } from '@domain/animals/constants/journey-options';

const TO_DO = 'To do';
const ORIGIN_TASK = 'Where is this consignment coming from?';
const COMMODITY_SELECTION_TASK = 'What are you importing?';
const ARRIVAL_DETAILS_TASK = 'Arrival details';
const IMPOSSIBLE_ARRIVAL_DATE = '31/2/2026';
const ARRIVAL_DATE_ERROR = 'Enter a real arrival date';
const COMMODITY_DETAILS_TASK = 'Commodity details';
const PORT_OF_EXIT_ERROR = 'Select a port of exit';
const DESTINATION_COUNTRY_ERROR = 'Select a destination country';
const REGION_CODE_REQUIRED_ERROR = 'Enter the region of origin code';
const INTERNAL_REFERENCE = 'Imports456GB';

test.describe('Save and return to overview', () => {
  test('main import reason: when a required answer is missing, refuses the save, names each missing answer and keeps the answer given', async ({
    animalsJourney,
    animalsPages,
  }) => {
    await animalsJourney.toImportReason();
    await animalsPages.importReason.reason('Transit').check();
    const referenceNumber = animalsPages.importReason.referenceNumberFromUrl();

    await animalsPages.importReason.saveAndReturnToOverview.click();

    await expect(animalsPages.importReason.heading).toBeVisible();
    await expect(animalsPages.importReason.errorSummaryLinks).toHaveText([PORT_OF_EXIT_ERROR, DESTINATION_COUNTRY_ERROR]);
    await expect(animalsPages.importReason.reason('Transit')).toBeChecked();
    await expect(await animalsPages.overview.taskStatusAfterReopening(referenceNumber, IMPORT_REASON_TASK)).toHaveText(TO_DO);
  });

  test('origin of the import: when the region code is left blank, refuses the save, names the region code, keeps "Yes" and saves nothing', async ({
    animalsJourney,
    animalsPages,
  }) => {
    await animalsJourney.startNotification();
    await animalsPages.overview.task(ORIGIN_TASK).click();
    await animalsPages.originOfImport.radioRequiresOriginCode('Yes').check();
    await animalsPages.originOfImport.regionCode.fill('');
    const referenceNumber = animalsPages.originOfImport.referenceNumberFromUrl();

    await animalsPages.originOfImport.saveAndReturnToOverview.click();

    await expect(animalsPages.originOfImport.heading).toBeVisible();
    await expect(animalsPages.originOfImport.errorSummaryLinks).toHaveText([REGION_CODE_REQUIRED_ERROR]);
    await expect(animalsPages.originOfImport.radioRequiresOriginCode('Yes')).toBeChecked();
    await animalsPages.overview.openTaskAfterReopening(referenceNumber, ORIGIN_TASK);
    await expect(animalsPages.originOfImport.radioRequiresOriginCode('No')).toBeChecked();
  });

  test('origin of the import: when every answer is valid, saves, shows the overview and keeps the answers on reopening', async ({
    animalsJourney,
    animalsPages,
  }) => {
    await animalsJourney.startNotification();
    await animalsPages.overview.task(ORIGIN_TASK).click();
    await animalsPages.originOfImport.country.choose(countryCodes.eu.france.display);
    await animalsPages.originOfImport.radioRequiresOriginCode('No').check();
    await animalsPages.originOfImport.internalReference.fill(INTERNAL_REFERENCE);

    await animalsPages.originOfImport.saveAndReturnToOverview.click();

    await expect(animalsPages.overview.heading).toBeVisible();
    await animalsPages.overview.task(ORIGIN_TASK).click();
    await expect(animalsPages.originOfImport.country.select).toHaveValue(countryCodes.eu.france.value);
    await expect(animalsPages.originOfImport.radioRequiresOriginCode('No')).toBeChecked();
    await expect(animalsPages.originOfImport.internalReference).toHaveValue(INTERNAL_REFERENCE);
  });

  test('arrival details: when the arrival date names no day, refuses the save and keeps nothing', async ({
    animalsJourney,
    animalsPages,
  }) => {
    await animalsJourney.toArrivalDetails();
    await animalsPages.arrivalDetails.fillArrivalDate(IMPOSSIBLE_ARRIVAL_DATE);

    await animalsPages.arrivalDetails.saveAndReturnToOverview.click();

    await expect(animalsPages.arrivalDetails.heading).toBeVisible();
    await expect(animalsPages.arrivalDetails.errorSummary).toBeVisible();
    await expect(animalsPages.arrivalDetails.arrivalDateError).toContainText(ARRIVAL_DATE_ERROR);
    await animalsPages.overview.openTaskAfterReopening(animalsPages.arrivalDetails.referenceNumberFromUrl(), ARRIVAL_DETAILS_TASK);
    await expect(animalsPages.arrivalDetails.arrivalDate).toHaveValue('');
  });

  test('arrival details: when no means of transport is chosen, saves the port, shows the overview and keeps the task to do', async ({
    animalsJourney,
    animalsPages,
  }) => {
    await animalsJourney.toArrivalDetails();
    await animalsPages.arrivalDetails.portOfEntry.choose(MANDATORY_ANSWERS.pointOfEntry.display);
    const referenceNumber = animalsPages.arrivalDetails.referenceNumberFromUrl();

    await animalsPages.arrivalDetails.saveAndReturnToOverview.click();

    await expect(animalsPages.overview.heading).toBeVisible();
    await expect(await animalsPages.overview.taskStatusAfterReopening(referenceNumber, ARRIVAL_DETAILS_TASK)).toHaveText(TO_DO);
    await animalsPages.overview.openTaskAfterReopening(referenceNumber, ARRIVAL_DETAILS_TASK);
    await expect(animalsPages.arrivalDetails.portOfEntry.select).toHaveValue(MANDATORY_ANSWERS.pointOfEntry.value);
  });

  test('commodity details: when the number of animals is blank, keeps its checks and stays on the page', async ({
    animalsJourney,
    animalsPages,
  }) => {
    await animalsJourney.toConsignmentDetails();

    await animalsPages.consignmentDetails.saveAndReturnToOverview.click();

    await expect(animalsPages.consignmentDetails.heading).toBeVisible();
    await expect(animalsPages.consignmentDetails.errorSummary).toBeVisible();
    await expect(animalsPages.consignmentDetails.animalsRequiredErrorLink).toBeVisible();
    const referenceNumber = animalsPages.consignmentDetails.referenceNumberFromUrl();
    await expect(await animalsPages.overview.taskStatusAfterReopening(referenceNumber, COMMODITY_DETAILS_TASK)).toHaveText(TO_DO);
  });

  test('origin of the import: when the region code is longer than five characters, refuses the save and keeps nothing', async ({
    animalsJourney,
    animalsPages,
  }) => {
    await animalsJourney.startNotification();
    await animalsPages.overview.task(ORIGIN_TASK).click();
    await animalsPages.originOfImport.radioRequiresOriginCode('Yes').check();
    await animalsPages.originOfImport.removeRegionCodeMaxlength();
    await animalsPages.originOfImport.regionCode.fill('ABCDEF');

    await animalsPages.originOfImport.saveAndReturnToOverview.click();

    await expect(animalsPages.originOfImport.heading).toBeVisible();
    await expect(animalsPages.originOfImport.errorSummary).toBeVisible();
    await expect(animalsPages.originOfImport.regionCodeMaxLengthErrorLink).toBeVisible();
    await animalsPages.overview.openTaskAfterReopening(animalsPages.originOfImport.referenceNumberFromUrl(), ORIGIN_TASK);
    await expect(animalsPages.originOfImport.regionCode).toHaveValue('');
  });

  test('what are you importing: when nothing is chosen, refuses the save with "Select a commodity" and leaves the task not complete', async ({
    animalsJourney,
    animalsPages,
  }) => {
    await animalsJourney.toCommoditySelection();
    const referenceNumber = animalsPages.commoditySelection.referenceNumberFromUrl();

    await animalsPages.commoditySelection.saveAndReturnToOverview.click();

    await expect(animalsPages.commoditySelection.heading).toBeVisible();
    await expect(animalsPages.commoditySelection.errorSummaryLinks).toHaveText([SELECT_COMMODITY_ERROR]);
    await expect(await animalsPages.overview.taskStatusAfterReopening(referenceNumber, COMMODITY_SELECTION_TASK)).toHaveText(TO_DO);
  });
});
