import path from 'node:path';
import { test, expect, WCAG_STANDARD } from '@fixtures/a11y';
import { commodityLines } from '@domain/animals/constants/commodity-lines';
import { IMPORT_REASON_TASK } from '@domain/animals/constants/import-reason-page';
import { govukConditionalRevealRadioOnOrigin, govukConditionalRevealRadiosOnReason } from '@utils/a11y-exclusions';
import { getRelativeDatePickerValue } from '@utils/date-utils';
import { writeEicarPdfFile } from '@utils/eicar-file-writer';
import { fileUploadPaths } from '@resources/file-upload/paths';
import { writePaddedPdf } from '@resources/file-upload/padded-pdf';
import { DOCUMENT_ISSUE_DATE, MAX_FILE_SIZE_BYTES, OVERSIZE_FILE_MESSAGE } from '@resources/file-upload/constants';
import { fileUploadTimeouts } from '@config/file-upload-timeouts';

const IDENTIFIER_MAX_LENGTH = 58;

test.describe(`Accessibility ${WCAG_STANDARD.name}`, { tag: '@a11y' }, () => {
  test.beforeEach(async ({ animalsJourney }) => {
    await animalsJourney.startNotificationAtOrigin();
  });

  test('each notification journey page with validation has no accessibility violations when errors are shown', async ({
    animalsJourney,
    pages,
    animalsPages,
    runA11yScan,
  }, testInfo) => {
    const errorSummaryHeading = pages.page.getByRole('heading', { name: 'There is a problem' });

    await test.step('Origin of import with validation errors', async () => {
      await animalsPages.overview.task('Where is this consignment coming from?').click();
      await animalsPages.originOfImport.heading.waitFor();
      await expect(animalsPages.originOfImport.country.field).toHaveValue('');
      await animalsPages.originOfImport.radioRequiresOriginCode('Yes').check();
      await animalsPages.originOfImport.saveAndContinue.click();
      await expect(errorSummaryHeading).toBeVisible();
      await runA11yScan({ exclude: govukConditionalRevealRadioOnOrigin });
      await animalsJourney.fillOriginOfImport();
      await animalsJourney.saveOriginOfImport();
      await animalsPages.overview.heading.waitFor();
    });

    await test.step('Commodity selection with validation errors', async () => {
      await animalsPages.overview.task('What are you importing?').click();
      await animalsPages.commoditySelection.heading.waitFor();
      await animalsPages.commoditySelection.saveAndContinue.click();
      await expect(errorSummaryHeading).toBeVisible();
      await runA11yScan();
      await animalsPages.commoditySelection.searchAndCheckSpecies([commodityLines.cattle]);
      await animalsPages.commoditySelection.saveAndContinue.click();
      await animalsPages.overview.heading.waitFor();
      await animalsPages.overview.task('Commodity details').click();
    });

    await test.step('Commodity details with validation errors', async () => {
      await animalsPages.consignmentDetails.heading.waitFor();
      await animalsPages.consignmentDetails.saveAndContinue.click();
      await expect(errorSummaryHeading).toBeVisible();
      await runA11yScan();
      await animalsPages.consignmentDetails.numberOfAnimals.fill('1');
      await animalsPages.consignmentDetails.numberOfPackages.fill('5');
      await animalsPages.consignmentDetails.saveAndContinue.click();
      await animalsPages.overview.heading.waitFor();
    });

    await test.step('Animal identification with validation errors', async () => {
      await animalsPages.overview.task('Identification details').click();
      await animalsPages.animalIdentification.heading.waitFor();
      await animalsPages.animalIdentification.earTag.fill('X'.repeat(IDENTIFIER_MAX_LENGTH + 1));
      await animalsPages.animalIdentification.saveAndContinue.click();
      await expect(errorSummaryHeading).toBeVisible();
      await runA11yScan();
      await animalsPages.animalIdentification.earTag.fill('UK123456789012');
      await animalsPages.animalIdentification.saveAndContinue.click();
      await animalsPages.overview.heading.waitFor();
    });

    await test.step('Import reason with validation errors', async () => {
      await animalsPages.overview.task(IMPORT_REASON_TASK).click();
      await animalsPages.importReason.heading.waitFor();
      await animalsPages.importReason.reason('Internal market').check();
      await animalsPages.importReason.saveAndContinue.click();
      await expect(errorSummaryHeading).toBeVisible();
      await runA11yScan({ exclude: govukConditionalRevealRadiosOnReason });
      await animalsPages.importReason.purpose('Breeding').check();
      await animalsPages.importReason.saveAndContinue.click();
      await animalsPages.overview.heading.waitFor();
      await animalsPages.overview.task('Additional details').click();
      await animalsPages.additionalDetails.heading.waitFor();
      await animalsPages.additionalDetails.certifiedFor('Slaughter').check();
      await animalsPages.additionalDetails.containsUnweanedAnimals('No').check();
      await animalsPages.additionalDetails.saveAndContinue.click();
      await animalsPages.overview.heading.waitFor();
    });

    await test.step('Upload documents with validation errors', async () => {
      await animalsPages.overview.task('Upload documents').click();
      await animalsPages.accompanyingDocuments.heading.waitFor();
      await animalsPages.accompanyingDocuments.saveAndAddAnother.click();
      await expect(errorSummaryHeading).toBeVisible();
      await runA11yScan();
      await animalsPages.accompanyingDocuments.fillDocument(
        `PWTXT${Date.now()}`,
        DOCUMENT_ISSUE_DATE,
        fileUploadPaths.restrictedFile10bTxt,
      );
      await animalsPages.accompanyingDocuments.saveAndAddAnother.click();
      await expect(errorSummaryHeading).toBeVisible();
      await runA11yScan();
      const oversizeFile = await writePaddedPdf(testInfo.outputPath('oversize.pdf'), MAX_FILE_SIZE_BYTES + 1);
      await animalsPages.accompanyingDocuments.fillDocument(`PWOVER${Date.now()}`, DOCUMENT_ISSUE_DATE, oversizeFile);
      await animalsPages.accompanyingDocuments.saveAndAddAnother.click();
      await expect(animalsPages.accompanyingDocuments.fileFieldError).toHaveText(`Error: ${OVERSIZE_FILE_MESSAGE}`);
      await runA11yScan();
    });

    await test.step('Upload documents with an infected file', async () => {
      const eicar = await writeEicarPdfFile(path.join(testInfo.outputDir, 'file-upload'));
      const reference = `PWVIRUS${Date.now()}`;
      await animalsPages.accompanyingDocuments.fillDocument(reference, DOCUMENT_ISSUE_DATE, eicar.filePath);
      await animalsPages.accompanyingDocuments.saveAndAddAnother.click();
      await expect(animalsPages.accompanyingDocuments.documentRow(reference)).toContainText('Virus found', {
        timeout: fileUploadTimeouts.virusScanComplete,
      });
      await expect(errorSummaryHeading).toBeVisible();
      await runA11yScan();
      await animalsPages.accompanyingDocuments.removeDocument(1).click();
      await expect(animalsPages.accompanyingDocuments.documentRow(reference)).toHaveCount(0);
      await runA11yScan();
      await animalsPages.overview.open(animalsPages.accompanyingDocuments.referenceNumberFromUrl());
      await animalsPages.overview.heading.waitFor();
    });

    await test.step('Continue to CPH number', async () => {
      await animalsJourney.fillAddressesAndOpenCph();
    });

    await test.step('CPH number with validation errors', async () => {
      await animalsPages.cphNumber.saveAndContinue.click();
      await expect(errorSummaryHeading).toBeVisible();
      await runA11yScan();
      await animalsPages.cphNumber.fillCphNumber();
      await animalsPages.cphNumber.saveAndContinue.click();
      await animalsPages.addresses.heading.waitFor();
      await animalsPages.addresses.continueButton.click();
      await animalsPages.overview.heading.waitFor();
    });

    await test.step('Arrival details with validation errors', async () => {
      await animalsPages.overview.task('Arrival details').click();
      await animalsPages.arrivalDetails.heading.waitFor();
      // Every field is optional on a draft, so an empty save goes through; an arrival
      // date outside the allowed window is what raises the error summary.
      await animalsPages.arrivalDetails.fillArrivalDate(getRelativeDatePickerValue({ yearOffset: -1 }));
      await animalsPages.arrivalDetails.saveAndContinue.click();
      await expect(errorSummaryHeading).toBeVisible();
      await runA11yScan();
      await animalsJourney.fillArrivalDetails();
      await animalsPages.arrivalDetails.saveAndContinue.click();
      await animalsPages.overview.heading.waitFor();
      await animalsPages.overview.task('Transit countries').click();
    });

    await test.step('Transited countries with validation errors', async () => {
      await animalsPages.transitedCountries.heading.waitFor();
      await animalsPages.transitedCountries.addCountryButton.click();
      await expect(errorSummaryHeading).toBeVisible();
      await runA11yScan();
      await animalsPages.transitedCountries.addCountry('France');
      await animalsPages.transitedCountries.saveAndContinue.click();
      await animalsPages.overview.heading.waitFor();
      await animalsPages.overview.task('Transport details').click();
    });

    await test.step('Continue to commercial transporter', async () => {
      await animalsPages.transporter.heading.waitFor();
      await animalsPages.transporter.addTransporter.click();
      await animalsPages.transporterAdd.heading.waitFor();
      await animalsPages.transporterAdd.transporterType('Commercial').check();
      await animalsPages.transporterAdd.saveAndContinue.click();
    });

    await test.step('Commercial transporter with validation errors', async () => {
      await animalsPages.commercialTransporter.heading.waitFor();
      await animalsPages.commercialTransporter.nameOrOrganisationName.fill('Lough Neagh Livestock Haulage Ltd');
      await animalsPages.commercialTransporter.saveAndContinue.click();
      await expect(errorSummaryHeading).toBeVisible();
      await runA11yScan();
    });

    await test.step('Continue to declaration', async () => {
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
      await animalsJourney.answerContact();
      await animalsPages.overview.reviewAndSubmitButton.click();
      await animalsPages.notificationView.heading.waitFor();
      await animalsPages.notificationView.continueButton.click();
      await animalsPages.declaration.heading.waitFor();
    });

    await test.step('Declaration with validation errors', async () => {
      await animalsPages.declaration.continueButton.click();
      await expect(errorSummaryHeading).toBeVisible();
      await runA11yScan();
    });
  });
});
