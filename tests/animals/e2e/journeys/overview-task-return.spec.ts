import { commoditySpecies } from '@domain/animals/constants/commodity-species';
import { meansOfTransport } from '@domain/animals/constants/means-of-transport';
import { IMPORT_REASON_TASK } from '@domain/animals/constants/import-reason-page';
import { SET_BASES } from '@page-objects/shared/sets';
import { fileUploadPaths } from '@resources/file-upload/paths';

import { test, expect } from '@fixtures';

test.describe('Overview task return', () => {
  test('each task opened from the overview returns to the overview on Save and continue, at its opening-run address, and reads Complete', async ({
    animalsJourney,
    animalsPages,
    pages,
  }) => {
    test.slow();

    const referenceNumber = await animalsJourney.startNotification();

    const expectOnOverview = async (): Promise<void> => {
      await expect(animalsPages.overview.heading).toBeVisible();
      await expect(pages.page).toHaveURL(new RegExp(`${SET_BASES.liveAnimals}/notifications/${referenceNumber}$`));
    };

    const openTask = async (name: string, slug: string): Promise<void> => {
      await expect(animalsPages.overview.task(name)).toHaveAttribute('href', new RegExp(`/notifications/${referenceNumber}/${slug}$`));
      await animalsPages.overview.task(name).click();
      await expect(pages.page).toHaveURL(new RegExp(`${SET_BASES.liveAnimals}/notifications/${referenceNumber}/${slug}$`));
    };

    const expectComplete = async (name: string): Promise<void> => {
      await expect(animalsPages.overview.taskStatus(name)).toHaveText('Complete');
    };

    await openTask('What are you importing?', 'commodities');
    await animalsPages.commoditySelection.searchAndCheckSpecies([commoditySpecies.cattle]);
    await animalsPages.commoditySelection.saveAndContinue.click();
    await expectOnOverview();
    await expect(animalsPages.consignmentDetails.heading).toBeHidden();
    await expectComplete('What are you importing?');

    await openTask('Commodity details', 'consignment-details');
    await animalsPages.consignmentDetails.numberOfAnimals.fill('1');
    await animalsPages.consignmentDetails.numberOfPackages.fill('5');
    await animalsPages.consignmentDetails.saveAndContinue.click();
    await expectOnOverview();
    await expectComplete('Commodity details');

    await openTask('Identification details', 'commodities/identification');
    await animalsPages.animalIdentification.earTag.fill('UK123456789012');
    await animalsPages.animalIdentification.saveAndContinue.click();
    await expectOnOverview();
    await expectComplete('Identification details');

    await openTask(IMPORT_REASON_TASK, 'import-reason');
    await animalsPages.importReason.reason('Internal market').check();
    await animalsPages.importReason.purpose('Breeding').check();
    await animalsPages.importReason.saveAndContinue.click();
    await expectOnOverview();
    await expectComplete(IMPORT_REASON_TASK);

    await openTask('Additional details', 'additional-details');
    await animalsPages.additionalDetails.certifiedFor('Slaughter').check();
    await animalsPages.additionalDetails.containsUnweanedAnimals('No').check();
    await animalsPages.additionalDetails.saveAndContinue.click();
    await expectOnOverview();
    await expectComplete('Additional details');

    await openTask('Arrival details', 'port-of-entry');
    await animalsJourney.fillArrivalDetails({ means: meansOfTransport.roadVehicle.display });
    await animalsPages.arrivalDetails.saveAndContinue.click();
    await expectOnOverview();
    await expect(animalsPages.transitedCountries.heading).toBeHidden();
    await expect(animalsPages.transporter.heading).toBeHidden();
    await expectComplete('Arrival details');

    await openTask('Transit countries', 'transit-countries');
    await animalsPages.transitedCountries.addCountry('France');
    await animalsPages.transitedCountries.saveAndContinue.click();
    await expectOnOverview();
    await expect(animalsPages.transporter.heading).toBeHidden();
    await expectComplete('Transit countries');

    await openTask('Transport details', 'transporters');
    await animalsPages.transporter.transporter('García Livestock Transport SL').check();
    await animalsPages.transporter.saveAndContinue.click();
    await expectOnOverview();
    await expectComplete('Transport details');

    await openTask('Upload documents', 'accompanying-documents');
    await animalsJourney.uploadDocumentAndWaitForScan({
      reference: `OVERVIEW${Date.now()}`,
      issueDate: '03/01/2026',
      filePath: fileUploadPaths.safeFile1kbPdf,
      type: 'VETERINARY_HEALTH_CERTIFICATE',
    });
    await animalsPages.accompanyingDocuments.continueButton.click();
    await expectOnOverview();
    await expectComplete('Upload documents');

    await openTask('Contact address for this consignment', 'consignment/contact/select');
    await animalsPages.contactAddress.address('Animal and Plant Health Agency').check();
    await animalsPages.contactAddress.saveAndContinue.click();
    await expectOnOverview();
    await expectComplete('Contact address for this consignment');
  });

  test('roles and addresses opened from the overview returns to the overview, not the CPH number page, for a consignment that needs one', async ({
    animalsJourney,
    animalsPages,
    pages,
  }) => {
    test.slow();

    const referenceNumber = await animalsJourney.startNotification();
    await animalsJourney.answerCommodity();

    await animalsPages.overview.task('Roles and addresses').click();
    await expect(pages.page).toHaveURL(new RegExp(`${SET_BASES.liveAnimals}/notifications/${referenceNumber}/addresses$`));
    await animalsJourney.addFiveParties();
    await animalsPages.addresses.continueButton.click();

    await expect(animalsPages.overview.heading).toBeVisible();
    await expect(pages.page).toHaveURL(new RegExp(`${SET_BASES.liveAnimals}/notifications/${referenceNumber}$`));
    await expect(animalsPages.cphNumber.heading).toBeHidden();

    await animalsPages.overview.task('Roles and addresses').click();
    await animalsPages.addresses.addCph.click();
    await animalsPages.cphNumber.fillCphNumber();
    await animalsPages.cphNumber.saveAndContinue.click();
    await expect(animalsPages.addresses.heading).toBeVisible();
    await animalsPages.addresses.continueButton.click();

    await expect(animalsPages.overview.heading).toBeVisible();
    await expect(animalsPages.overview.taskStatus('Roles and addresses')).toHaveText('Complete');
  });
});
