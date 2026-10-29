import { commoditySpecies } from '@domain/animals/constants/commodity-species';
import { test, expect, WCAG_STANDARD } from '@fixtures/a11y';
import { IMPORT_REASON_TASK } from '@domain/animals/constants/import-reason-page';
import { govukConditionalRevealRadiosOnReason } from '@utils/a11y-exclusions';
import { getRelativeAppDateText } from '@utils/date-utils';

const PRIVATE_TRANSPORTER = {
  name: 'Jean Dupont',
  addressLine1: '12 Rue des Fermes',
  townOrCity: 'Amiens',
  postalOrZipCode: '80000',
  country: 'France',
  telephoneNumber: '+33 3 22 55 01 44',
  emailAddress: 'jean.dupont@example.fr',
};

test.describe(`Accessibility ${WCAG_STANDARD.name}`, { tag: '@a11y' }, () => {
  test('the reason-gated and private transporter pages have no accessibility violations', async ({
    animalsJourney,
    pages,
    animalsPages,
    runA11yScan,
  }) => {
    test.slow();
    await animalsJourney.startNotification();
    await animalsJourney.answerCommodity();

    await test.step('Import reason: Transit', async () => {
      await animalsPages.overview.task(IMPORT_REASON_TASK).click();
      await animalsPages.importReason.reason('Transit').check();
      await animalsPages.importReason.selectTransitPortOfExitByIndex(2);
      await animalsPages.importReason.selectTransitDestinationCountry('FR');
      await runA11yScan({ exclude: govukConditionalRevealRadiosOnReason });
      await animalsPages.importReason.saveAndContinue.click();
      await animalsPages.overview.heading.waitFor();
      await animalsPages.overview.task('Additional details').click();
      await animalsPages.additionalDetails.heading.waitFor();
      await animalsPages.additionalDetails.saveAndContinue.click();
      await animalsPages.overview.heading.waitFor();
    });

    await test.step('Import reason: Temporary admission of horses', async () => {
      await animalsPages.overview.task(IMPORT_REASON_TASK).click();
      await animalsPages.importReason.reason('Temporary admission horses').check();
      await animalsPages.importReason.temporaryAdmissionExitDate.fill(getRelativeAppDateText({ monthOffset: 2 }));
      await animalsPages.importReason.selectTemporaryAdmissionPortOfExitByIndex(2);
      await runA11yScan({ exclude: govukConditionalRevealRadiosOnReason });
      await animalsPages.importReason.saveAndContinue.click();
      await animalsPages.overview.heading.waitFor();
      await animalsPages.overview.task('Additional details').click();
      await animalsPages.additionalDetails.heading.waitFor();
      await animalsPages.additionalDetails.saveAndContinue.click();
      await animalsPages.overview.heading.waitFor();
    });

    await test.step('Private transporter', async () => {
      await animalsJourney.reachTransporterFromHub();
      await animalsPages.transporter.addTransporter.click();
      await animalsPages.transporterAdd.heading.waitFor();
      await animalsPages.transporterAdd.transporterType('Private').check();
      await runA11yScan();
      await animalsPages.transporterAdd.saveAndContinue.click();
      await animalsPages.privateTransporter.heading.waitFor();
      await runA11yScan();
      await animalsPages.privateTransporter.name.fill(PRIVATE_TRANSPORTER.name);
      await animalsPages.privateTransporter.saveAndContinue.click();
      await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toBeVisible();
      await runA11yScan();
      await animalsPages.privateTransporter.fill(PRIVATE_TRANSPORTER);
      await runA11yScan();
    });
  });

  test('commodity details with two species and the horse and cat identifier sets have no accessibility violations', async ({
    animalsJourney,
    animalsPages,
    runA11yScan,
  }) => {
    const { horse, domesticCat } = commoditySpecies;
    const horseCard = animalsPages.animalIdentification.speciesCard(horse);
    const catCard = animalsPages.animalIdentification.speciesCard(domesticCat);

    await test.step('Commodity details with two species', async () => {
      await animalsJourney.toConsignmentDetails([horse, domesticCat]);
      await runA11yScan();
      await animalsPages.consignmentDetails.fillAnimalCountFor(horse, 1);
      await animalsPages.consignmentDetails.fillAnimalCountFor(domesticCat, 1);
      await animalsPages.consignmentDetails.saveAndContinue.click();
      await animalsPages.overview.heading.waitFor();
      await animalsPages.overview.task('Identification details').click();
    });

    await test.step('Identification details for the horse and cat identifier sets', async () => {
      await animalsPages.animalIdentification.heading.waitFor();
      await runA11yScan();
    });

    await test.step('Identification details for the horse and cat identifier sets, filled in', async () => {
      await horseCard.getByLabel('Microchip', { exact: true }).fill('985112345678901');
      await horseCard.getByLabel('Passport', { exact: true }).fill('HORSE-PASSPORT-1');
      await horseCard.getByLabel('Horse name', { exact: true }).fill('Bramble');
      await catCard.getByLabel('Microchip', { exact: true }).fill('985112345678902');
      await catCard.getByLabel('Passport', { exact: true }).fill('CAT-PASSPORT-1');
      await catCard.getByLabel('Tattoo', { exact: true }).fill('TATTOO-1');
      await runA11yScan();
    });
  });
});
