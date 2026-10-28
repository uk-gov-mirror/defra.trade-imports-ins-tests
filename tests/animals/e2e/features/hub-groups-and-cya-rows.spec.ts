import type { Locator } from '@playwright/test';
import { test, expect } from '@fixtures';
import { speciesCardTitle } from '@domain/animals/constants/commodity-lines';
import { IMPORT_REASON_TASK } from '@domain/animals/constants/import-reason-page';
import { ALL_ANSWERS_WITHOUT_DOCUMENT, CPH_NUMBER } from '@domain/animals/constants/journey-options';

test.describe('Hub groups and check-your-answers rows', { tag: '@duplicated-in-frontend' }, () => {
  test('the hub groups its tasks under the six numbered group headings, with nothing after them', async ({
    animalsJourney,
    pages,
    animalsPages,
  }) => {
    await animalsJourney.startNotification();

    await expect(pages.page.getByRole('heading', { level: 2, name: 'Notification tasklist' })).toBeVisible();

    await expect(animalsPages.overview.numberedSectionHeadings).toHaveText([
      '1. About the consignment',
      '2. Description of the goods',
      '3. Transport and arrival',
      '4. Documents',
      '5. Consignment parties',
      '6. Contact address',
    ]);

    await expect(pages.page.locator('.govuk-button-group .govuk-button')).toHaveText(['Review and submit', 'Return to dashboard']);

    await expect(pages.page.locator('ul.app-task-list')).toHaveCount(6);
    await expect(animalsPages.overview.taskTitlesInSectionHeaded('1. About the consignment')).toHaveText([
      'Where is this consignment coming from?',
      'What are you importing?',
      IMPORT_REASON_TASK,
    ]);
    await expect(animalsPages.overview.taskTitlesInSectionHeaded('2. Description of the goods')).toHaveText([
      'Commodity details',
      'Additional details',
    ]);
    await expect(animalsPages.overview.taskTitlesInSectionHeaded('3. Transport and arrival')).toHaveText([
      'Arrival details',
      'Transport details',
    ]);
    await expect(animalsPages.overview.taskTitlesInSectionHeaded('4. Documents')).toHaveText(['Upload documents']);
    await expect(animalsPages.overview.taskTitlesInSectionHeaded('5. Consignment parties')).toHaveText(['Roles and addresses']);
    await expect(animalsPages.overview.taskTitlesInSectionHeaded('6. Contact address')).toHaveText([
      'Contact address for this consignment',
    ]);
  });

  test('after completing every section the check-your-answers page renders the answered rows', async ({
    animalsJourney,
    pages,
    animalsPages,
    referenceDataApi,
  }) => {
    test.slow();
    const answers = ALL_ANSWERS_WITHOUT_DOCUMENT;
    await animalsJourney.toReview(answers);
    const commonName = await referenceDataApi.findCommonName(answers.species);

    const value = (card: Locator, key: string) =>
      card.locator('.govuk-summary-list__row', { has: pages.page.getByText(key, { exact: true }) }).locator('.govuk-summary-list__value');

    await expect(animalsPages.notificationView.heading).toBeVisible();
    await expect(pages.page.getByRole('heading', { level: 2, name: '1. About the consignment' })).toBeVisible();
    await expect(pages.page.getByRole('heading', { level: 2, name: '2. Description of the goods' })).toBeVisible();
    await expect(pages.page.getByRole('heading', { level: 2, name: '3. Transport and arrival' })).toBeVisible();
    await expect(pages.page.getByRole('heading', { level: 2, name: '4. Documents' })).toBeVisible();
    await expect(pages.page.getByRole('heading', { level: 2, name: '5. Consignment parties' })).toBeVisible();
    await expect(pages.page.getByRole('heading', { level: 2, name: '6. Contact address' })).toBeVisible();
    await expect(animalsPages.notificationView.summaryCard('Uploaded documents')).toContainText('You have not added any documents yet.');
    await expect(animalsPages.notificationView.changeLink('Change uploaded documents')).toBeVisible();

    await expect(pages.page.getByRole('heading', { level: 3 })).toHaveText([
      'Where is this consignment coming from?',
      'Main import reason',
      'Commodity details',
      'Additional details',
      'Arrival details',
      'Transit countries',
      'Transport details',
      'Upload documents',
      'Roles and addresses',
      'Contact address for this consignment',
    ]);

    const importDetails = animalsPages.notificationView.summaryCard('Import details');
    await expect(value(importDetails, 'Country of origin')).toHaveText(answers.countryCode.display);
    await expect(value(importDetails, 'Region of origin code required')).toHaveText('Yes');
    await expect(animalsPages.notificationView.regionOfOriginCode).toHaveText(`${answers.countryCode.value}-${answers.regionCode}`);
    await expect(value(importDetails, 'Internal reference number')).toHaveText(answers.internalReference);

    const additionalAnimalDetails = animalsPages.notificationView.summaryCard('Additional animal details');
    await expect(value(additionalAnimalDetails, 'Certified for')).toHaveText(answers.certifiedFor.display);
    await expect(value(additionalAnimalDetails, 'Includes unweaned animals')).toHaveText('No');

    const reasonForImport = animalsPages.notificationView.summaryCard('Reason for import');
    await expect(value(reasonForImport, 'Reason for import')).toHaveText(answers.importReason.display);
    await expect(value(reasonForImport, 'Purpose in the market')).toHaveText(answers.internalMarketPurpose.display);

    const speciesCard = animalsPages.notificationView.summaryCard(speciesCardTitle(answers.species));
    await expect(value(speciesCard, 'Commodity code')).toHaveText(answers.species.commodityCode);
    await expect(value(speciesCard, 'Common name')).toHaveText(commonName);
    await expect(value(speciesCard, 'Species')).toHaveText(answers.species.latinName);
    await expect(value(speciesCard, 'Number of animals')).toHaveText(String(answers.noOfAnimals));
    await expect(value(speciesCard, 'Number of packages')).toHaveText(String(answers.noOfPackages));
    await expect(speciesCard.getByRole('heading', { name: 'Animal details' })).toBeVisible();
    await expect(speciesCard.getByRole('columnheader', { name: 'Ear tag' })).toBeVisible();
    await expect(speciesCard.getByRole('cell', { name: 'Animal 1' })).toBeVisible();
    await expect(speciesCard.getByRole('cell', { name: answers.earTag })).toBeVisible();
    await expect(speciesCard.getByRole('cell', { name: answers.passportNumber })).toBeVisible();

    const arrivalDetails = animalsPages.notificationView.summaryCard('Arrival details');
    await expect(value(arrivalDetails, 'Port of entry')).toHaveText(answers.pointOfEntry.display);
    await expect(value(arrivalDetails, 'Arrival date at port of entry')).toHaveText(answers.arrivalDate);
    await expect(value(arrivalDetails, 'Means of transport to the port of entry')).toHaveText(answers.meansOfTransport.display);
    await expect(value(arrivalDetails, 'Transport identification')).toHaveText(answers.transportIdentification);
    await expect(value(arrivalDetails, 'Transport document reference')).toHaveText(answers.transportDocumentReference);

    const transitCountries = animalsPages.notificationView.summaryCard('Transit countries');
    await expect(value(transitCountries, 'Countries that the consignment will travel through')).toHaveText(
      answers.transitedCountries.map(({ display }) => display).join(', '),
    );

    const transportDetails = animalsPages.notificationView.summaryCard('Transport details');
    await expect(value(transportDetails, 'Name')).toContainText(answers.transporter.display);
    await expect(value(transportDetails, 'Type')).toHaveText('Commercial');

    const rolesAndAddresses = animalsPages.notificationView.summaryCard('Roles and addresses');
    await expect(value(rolesAndAddresses, 'Place of origin')).toContainText(answers.parties.placeOfOrigin);
    await expect(value(rolesAndAddresses, 'Consignor')).toContainText(answers.parties.consignor);
    await expect(value(rolesAndAddresses, 'Consignee')).toContainText(answers.parties.consignee);
    await expect(value(rolesAndAddresses, 'Importer')).toContainText(answers.parties.importer);
    await expect(value(rolesAndAddresses, 'Place of destination')).toContainText(answers.parties.placeOfDestination);
    await expect(value(rolesAndAddresses, 'County parish holding (CPH) number')).toHaveText(CPH_NUMBER);

    const contactAddress = animalsPages.notificationView.summaryCard('Contact address for this consignment');
    await expect(value(contactAddress, 'Contact address')).toContainText(answers.contactAddress);
  });
});
