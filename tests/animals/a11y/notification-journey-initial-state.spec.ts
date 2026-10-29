import { commoditySpecies } from '@domain/animals/constants/commodity-species';
import { test, WCAG_STANDARD } from '@fixtures/a11y';
import { IMPORT_REASON_TASK } from '@domain/animals/constants/import-reason-page';
import { govukConditionalRevealRadioOnOrigin, govukConditionalRevealRadiosOnReason } from '@utils/a11y-exclusions';

test.describe(`Accessibility ${WCAG_STANDARD.name}`, { tag: '@a11y' }, () => {
  test.beforeEach(async ({ animalsJourney }) => {
    await animalsJourney.toNotificationDashboard();
  });

  test('each notification journey page has no accessibility violations on initial load', async ({
    animalsJourney,
    animalsPages,
    runA11yScan,
  }) => {
    await test.step('Notification dashboard', async () => {
      await runA11yScan();
    });

    await test.step('Origin of import', async () => {
      await animalsPages.dashboard.btnCreateNewNotification.click();
      await animalsPages.originOfImport.heading.waitFor();
      await runA11yScan({ exclude: govukConditionalRevealRadioOnOrigin });
    });

    await test.step('Overview', async () => {
      const referenceNumber = animalsPages.originOfImport.referenceNumberFromUrl();
      await animalsJourney.fillOriginOfImport();
      await animalsJourney.saveOriginOfImport();
      await animalsPages.overview.open(referenceNumber);
      await animalsPages.overview.heading.waitFor();
      await runA11yScan();
    });

    await test.step('Commodity selection', async () => {
      await animalsPages.overview.task('What are you importing?').click();
      await animalsPages.commoditySelection.heading.waitFor();
      await runA11yScan();
      await animalsPages.commoditySelection.searchAndCheckSpecies([commoditySpecies.cattle]);
      await animalsPages.commoditySelection.saveAndContinue.click();
      await animalsPages.overview.heading.waitFor();
      await animalsPages.overview.task('Commodity details').click();
    });

    await test.step('Commodity details', async () => {
      await animalsPages.consignmentDetails.heading.waitFor();
      await runA11yScan();
      await animalsPages.consignmentDetails.numberOfAnimals.fill('1');
      await animalsPages.consignmentDetails.numberOfPackages.fill('5');
      await animalsPages.consignmentDetails.saveAndContinue.click();
      await animalsPages.overview.heading.waitFor();
    });

    await test.step('Animal identification', async () => {
      await animalsPages.overview.task('Identification details').click();
      await animalsPages.animalIdentification.heading.waitFor();
      await runA11yScan();
      await animalsPages.animalIdentification.earTag.fill('UK123456789012');
      await animalsPages.animalIdentification.saveAndContinue.click();
      await animalsPages.overview.heading.waitFor();
    });

    await test.step('Import reason', async () => {
      await animalsPages.overview.task(IMPORT_REASON_TASK).click();
      await animalsPages.importReason.heading.waitFor();
      await runA11yScan({ exclude: govukConditionalRevealRadiosOnReason });
      await animalsPages.importReason.reason('Internal market').check();
      await animalsPages.importReason.purpose('Breeding').check();
      await animalsPages.importReason.saveAndContinue.click();
      await animalsPages.overview.heading.waitFor();
      await animalsPages.overview.task('Additional details').click();
    });

    await test.step('Additional details', async () => {
      await animalsPages.additionalDetails.heading.waitFor();
      await runA11yScan();
      await animalsPages.additionalDetails.certifiedFor('Slaughter').check();
      await animalsPages.additionalDetails.containsUnweanedAnimals('No').check();
      await animalsPages.additionalDetails.saveAndContinue.click();
      await animalsPages.overview.heading.waitFor();
    });

    await test.step('Upload documents', async () => {
      await animalsPages.overview.task('Upload documents').click();
      await animalsPages.accompanyingDocuments.heading.waitFor();
      await runA11yScan();
      await animalsPages.overview.open(animalsPages.accompanyingDocuments.referenceNumberFromUrl());
      await animalsPages.overview.heading.waitFor();
    });

    await test.step('Consignment addresses', async () => {
      await animalsPages.overview.task('Roles and addresses').click();
      await animalsPages.addresses.heading.waitFor();
      await runA11yScan();
    });

    await test.step('Consignor selection', async () => {
      await animalsPages.addresses.addParty('Consignor').click();
      await animalsPages.consignorSelection.heading.waitFor();
      await runA11yScan();
      await animalsPages.consignorSelection.select('Astra Rosales');
      await animalsPages.consignorSelection.saveAndContinue.click();
      await animalsPages.addresses.heading.waitFor();
    });

    await test.step('Remaining addresses and CPH number', async () => {
      await animalsJourney.addRemainingParties();
      await animalsPages.addresses.addCph.click();
    });

    await test.step('CPH number', async () => {
      await animalsPages.cphNumber.heading.waitFor();
      await runA11yScan();
      await animalsPages.cphNumber.fillCphNumber();
      await animalsPages.cphNumber.saveAndContinue.click();
      await animalsPages.addresses.heading.waitFor();
      await animalsPages.addresses.continueButton.click();
      await animalsPages.overview.heading.waitFor();
    });

    await test.step('Arrival details', async () => {
      await animalsPages.overview.task('Arrival details').click();
      await animalsPages.arrivalDetails.heading.waitFor();
      await runA11yScan();
      await animalsJourney.fillArrivalDetails();
      await animalsPages.arrivalDetails.saveAndContinue.click();
      await animalsPages.overview.heading.waitFor();
      await animalsPages.overview.task('Transit countries').click();
    });

    await test.step('Transited countries', async () => {
      await animalsPages.transitedCountries.heading.waitFor();
      await runA11yScan();
      await animalsPages.transitedCountries.addCountry('France');
      await animalsPages.transitedCountries.saveAndContinue.click();
      await animalsPages.overview.heading.waitFor();
      await animalsPages.overview.task('Transport details').click();
    });

    await test.step('Transporter list', async () => {
      await animalsPages.transporter.heading.waitFor();
      await runA11yScan();
      await animalsPages.transporter.addTransporter.click();
    });

    await test.step('Transporter type', async () => {
      await animalsPages.transporterAdd.heading.waitFor();
      await runA11yScan();
      await animalsPages.transporterAdd.transporterType('Commercial').check();
      await animalsPages.transporterAdd.saveAndContinue.click();
    });

    await test.step('Add commercial transporter', async () => {
      await animalsPages.commercialTransporter.heading.waitFor();
      await runA11yScan();
      await animalsPages.commercialTransporter.fill({
        approvalNumber: 'NI/TA/2026/0041',
        name: 'Lough Neagh Livestock Haulage Ltd',
        addressLine1: '4 Shore Road',
        townOrCity: 'Antrim',
        postalOrZipCode: 'BT41 4LB',
        emailAddress: 'ops@loughneagh.example',
        telephoneNumber: '+44 28 9446 1200',
      });
      await animalsPages.commercialTransporter.saveAndContinue.click();
      await animalsPages.overview.heading.waitFor();
    });

    await test.step('Contact address', async () => {
      await animalsPages.overview.task('Contact address for this consignment').click();
      await animalsPages.contactAddress.heading.waitFor();
      await runA11yScan();
      await animalsPages.contactAddress.address('Animal and Plant Health Agency').check();
      await animalsPages.contactAddress.saveAndContinue.click();
      await animalsPages.overview.heading.waitFor();
    });

    await test.step('Review your notification', async () => {
      await animalsPages.overview.reviewAndSubmitButton.click();
      await animalsPages.notificationView.heading.waitFor();
      await runA11yScan();
      await animalsPages.notificationView.continueButton.click();
    });

    await test.step('Declaration', async () => {
      await animalsPages.declaration.heading.waitFor();
      await runA11yScan();
    });
  });
});
