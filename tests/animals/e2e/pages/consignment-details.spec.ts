import { commoditySpecies } from '@domain/animals/constants/commodity-species';
import { test, expect } from '@fixtures';

test.describe('Commodity details page', { tag: '@duplicated-in-frontend' }, () => {
  test.beforeEach(async ({ animalsJourney }) => {
    await animalsJourney.toConsignmentDetails();
  });

  test('renders the page controls', async ({ animalsPages }) => {
    await expect(animalsPages.consignmentDetails.heading).toBeVisible();
    await expect(animalsPages.consignmentDetails.numberOfAnimals).toBeVisible();
    await expect(animalsPages.consignmentDetails.numberOfPackages).toBeVisible();
    await expect(animalsPages.consignmentDetails.saveAndContinue).toBeVisible();
  });

  test('captions the page with the description-of-the-goods section', async ({ animalsPages }) => {
    await expect(animalsPages.consignmentDetails.caption).toBeVisible();
    await expect(animalsPages.consignmentDetails.headingBelowCaption).toHaveText('Commodity details');
  });

  test('lists the selected commodity with its code and species', async ({ animalsPages }) => {
    const table = animalsPages.consignmentDetails.selectedCommodities.table;
    const { cattle } = commoditySpecies;

    await expect(table.getByRole('columnheader')).toHaveText(['Commodity code', 'Species', 'Actions']);
    await expect(animalsPages.consignmentDetails.selectedCommodities.rowFor(cattle).getByRole('cell')).toHaveText([
      cattle.commodityCode,
      cattle.latinName,
      `Remove ${cattle.commodityCode} ${cattle.latinName}`,
    ]);
  });

  test('leaves the number of animals empty on load', async ({ animalsPages }) => {
    await expect(animalsPages.consignmentDetails.numberOfAnimals).toHaveValue('');
  });

  test('accepts valid consignment details', async ({ pages, animalsPages }) => {
    await animalsPages.consignmentDetails.numberOfAnimals.fill('1');
    await animalsPages.consignmentDetails.numberOfPackages.fill('5');
    await animalsPages.consignmentDetails.saveAndContinue.click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toHaveCount(0);
  });
});

test.describe('Commodity details page with two species of one commodity', { tag: '@duplicated-in-frontend' }, () => {
  test.beforeEach(async ({ animalsJourney }) => {
    await animalsJourney.toConsignmentDetails([commoditySpecies.cattle, commoditySpecies.bison]);
  });

  test('lists every number of animals error before any number of packages error', async ({ animalsPages }) => {
    for (const box of await animalsPages.consignmentDetails.numberOfPackages.all()) {
      await box.fill('abc');
    }
    await animalsPages.consignmentDetails.saveAndContinue.click();

    await expect(animalsPages.consignmentDetails.errorSummaryLinks).toHaveText([
      'Enter the number of animals',
      'Enter the number of animals',
      'Number of packages must be a whole number, like 5',
      'Number of packages must be a whole number, like 5',
    ]);
    await animalsPages.consignmentDetails.errorSummaryLinks.nth(2).click();
    await expect(animalsPages.consignmentDetails.numberOfPackages.first()).toBeFocused();
  });

  test("lists both species' Latin names, one per line, in the commodity's Species cell", async ({ animalsPages }) => {
    const speciesCell = animalsPages.consignmentDetails.selectedCommodities.speciesCell(
      animalsPages.consignmentDetails.selectedCommodities.rowFor(commoditySpecies.cattle),
    );

    expect(await speciesCell.evaluate((el) => (el as HTMLElement).innerText)).toBe(
      `${commoditySpecies.bison.latinName},\n${commoditySpecies.cattle.latinName}`,
    );
  });
});

test.describe('Commodity details page after counts are saved', { tag: '@duplicated-in-frontend' }, () => {
  test.beforeEach(async ({ animalsJourney }) => {
    await animalsJourney.toConsignmentDetailsWithSavedCounts({ animals: '2', packages: '5' });
  });

  test('returns from Add another commodity to Commodity details with the saved counts still filled in', async ({ animalsPages }) => {
    await animalsPages.consignmentDetails.addAnotherCommodity.click();
    await expect(animalsPages.commoditySelection.heading).toBeVisible();

    await animalsPages.commoditySelection.searchAndCheckSpecies([commoditySpecies.domesticCat]);
    await animalsPages.commoditySelection.saveAndContinue.click();

    await expect(animalsPages.consignmentDetails.heading).toBeVisible();
    await expect(await animalsPages.consignmentDetails.numberOfAnimalsFor(commoditySpecies.cattle)).toHaveValue('2');
    await expect(await animalsPages.consignmentDetails.numberOfPackagesFor(commoditySpecies.cattle)).toHaveValue('5');
    await expect(await animalsPages.consignmentDetails.numberOfAnimalsFor(commoditySpecies.domesticCat)).toHaveValue('');
    await expect(await animalsPages.consignmentDetails.numberOfPackagesFor(commoditySpecies.domesticCat)).toHaveValue('');
  });
});
