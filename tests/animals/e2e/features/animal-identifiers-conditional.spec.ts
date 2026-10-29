import { MANDATORY_COMMODITY_LINES } from '@domain/animals/constants/journey-commodity-line-answers';
import { commoditySpecies } from '@domain/animals/constants/commodity-species';

import { test, expect } from '@fixtures';

test.describe('Animal identifiers — conditional identifier surface', { tag: '@duplicated-in-frontend' }, () => {
  test("a domestic cat's unit form asks for passport, tattoo and a permanent address, and refuses a partial address", async ({
    animalsJourney,
    pages,
    animalsPages,
  }) => {
    await animalsJourney.toAnimalIdentificationWithCounts([{ species: commoditySpecies.domesticCat, animalCount: 2 }]);
    await expect(animalsPages.animalIdentification.enterDetailsCounterHeading(commoditySpecies.domesticCat, 1, 2)).toBeVisible();

    await expect(animalsPages.animalIdentification.passportNumber).toBeVisible();
    await expect(pages.page.getByLabel('Tattoo')).toBeVisible();
    await expect(animalsPages.animalIdentification.earTag).toBeHidden();
    await expect(pages.page.getByLabel('Horse name')).toBeHidden();
    await expect(pages.page.getByLabel('Identification details')).toHaveCount(0);
    await expect(pages.page.getByLabel('Animal description')).toHaveCount(0);
    await expect(pages.page.getByLabel('Name or organisation name')).toBeVisible();
    await expect(pages.page.getByLabel('Country')).toHaveCount(0);

    const catLine = MANDATORY_COMMODITY_LINES.domesticCat;
    const { passportNumber, permanentAddress } = catLine;

    await animalsPages.animalIdentification.passportNumber.fill(passportNumber);
    await animalsPages.animalIdentification.permanentAddressName.fill(permanentAddress.nameOrOrganisationName);
    await animalsPages.animalIdentification.saveAndAddAnother.click();
    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toBeVisible();
    await expect(pages.page.getByRole('link', { name: 'Enter address line 1' })).toBeVisible();

    await animalsJourney.saveAnimalWithPermanentAddress(catLine);

    await expect(animalsPages.animalIdentification.heading).toBeVisible();
    const unitRow = animalsPages.animalIdentification.savedAnimalRow(catLine.species, 1);
    await expect(animalsPages.animalIdentification.identifierColumn('Permanent address')).toBeVisible();
    await expect(unitRow.getByRole('cell', { name: passportNumber, exact: true })).toBeVisible();
    await expect(unitRow.getByRole('cell', { name: permanentAddress.nameOrOrganisationName, exact: true })).toBeVisible();
  });

  test('a commodity with no identifier type of its own gets no card, while the lines that have one keep theirs', async ({
    animalsJourney,
    pages,
    animalsPages,
  }) => {
    await animalsJourney.toAnimalIdentificationWithCounts([
      { species: commoditySpecies.cattle, animalCount: 1 },
      { species: commoditySpecies.ostrich, animalCount: 1 },
    ]);

    await expect(animalsPages.animalIdentification.enterDetailsCounterHeading(commoditySpecies.cattle, 1, 1)).toBeVisible();
    await expect(animalsPages.animalIdentification.earTag).toBeVisible();
    await expect(pages.page.getByRole('heading', { name: `Enter details for ${commoditySpecies.ostrich.latinName}` })).toHaveCount(0);
    await expect(pages.page.getByLabel('Identification details')).toHaveCount(0);
    await expect(pages.page.getByLabel('Animal description')).toHaveCount(0);
  });

  test('a consignment where no commodity has an identifier type never reaches the identification page', async ({
    animalsJourney,
    pages,
    animalsPages,
  }) => {
    await animalsJourney.toConsignmentDetails([commoditySpecies.ostrich]);
    await animalsPages.consignmentDetails.numberOfAnimals.fill('2');
    await animalsPages.consignmentDetails.saveAndContinue.click();
    await expect(animalsPages.overview.heading).toBeVisible();

    const referenceNumber = animalsPages.overview.referenceNumberFromUrl();
    await animalsPages.animalIdentification.open(referenceNumber);
    await expect(animalsPages.overview.heading).toBeVisible();
    await expect(animalsPages.animalIdentification.heading).toHaveCount(0);
    await expect(pages.page.getByLabel('Identification details')).toHaveCount(0);
    await expect(pages.page.getByLabel('Animal description')).toHaveCount(0);
  });
});
