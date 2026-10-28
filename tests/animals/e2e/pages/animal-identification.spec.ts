import { commodityLines } from '@domain/animals/constants/commodity-lines';
import { test, expect } from '@fixtures';

const EAR_TAG_ONE_OVER_LIMIT = 'X'.repeat(59);

test.describe('Animal identification page', { tag: '@duplicated-in-frontend' }, () => {
  test.beforeEach(async ({ animalsJourney }) => {
    await animalsJourney.toAnimalIdentification();
  });

  test('renders the page controls', async ({ animalsPages }) => {
    await expect(animalsPages.animalIdentification.heading).toBeVisible();
    await expect(animalsPages.animalIdentification.earTag).toBeVisible();
    await expect(animalsPages.animalIdentification.passportNumber).toBeVisible();
    await expect(animalsPages.animalIdentification.saveAndAddAnother).toHaveCount(0);
    await expect(animalsPages.animalIdentification.saveAndContinue).toBeVisible();
  });

  test('leaves the ear tag empty on load', async ({ animalsPages }) => {
    await expect(animalsPages.animalIdentification.earTag).toHaveValue('');
  });

  test('accepts a valid ear tag', async ({ pages, animalsPages }) => {
    await animalsPages.animalIdentification.earTag.fill('UK123456789012');
    await animalsPages.animalIdentification.saveAndContinue.click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toHaveCount(0);
  });
});

test.describe('Animal identification sections and species cards', { tag: '@duplicated-in-frontend' }, () => {
  test.beforeEach(async ({ animalsJourney }) => {
    await animalsJourney.toAnimalIdentificationWithCounts([
      { species: commodityLines.cattle, animalCount: 2 },
      { species: commodityLines.bison, animalCount: 2 },
      { species: commodityLines.domesticCat, animalCount: 2 },
    ]);
  });

  test('summarises cattle in one row listing both species with their total, and the cat on its own row', async ({ animalsPages }) => {
    const { selectedCommodities } = animalsPages.animalIdentification;
    const { cattle, bison, domesticCat } = commodityLines;
    const cattleRow = selectedCommodities.rowFor(cattle);
    await expect(selectedCommodities.codeCell(cattleRow)).toHaveText(cattle.commodityCode);
    await expect(selectedCommodities.speciesCell(cattleRow)).toHaveText(`${bison.latinName}, ${cattle.latinName}`, {
      useInnerText: true,
    });
    await expect(selectedCommodities.animalCountCell(cattleRow)).toHaveText('4');

    const catRow = selectedCommodities.rowFor(domesticCat);
    await expect(selectedCommodities.codeCell(catRow)).toHaveText(domesticCat.commodityCode);
    await expect(selectedCommodities.speciesCell(catRow)).toHaveText(domesticCat.latinName);
    await expect(selectedCommodities.animalCountCell(catRow)).toHaveText('2');
  });

  test('holds the cattle species cards under the 0102 section and the cat card under its own section, each in the order the species are listed for selection', async ({
    pages,
  }) => {
    const { cattle, bison, domesticCat } = commodityLines;
    await expect(pages.page.locator('main h2, main h3')).toHaveText([
      cattle.commodityCode,
      bison.latinName,
      cattle.latinName,
      domesticCat.commodityCode,
      domesticCat.latinName,
    ]);
  });

  test('saves only the pressed card, shows no error for another species, and leaves that species empty', async ({
    pages,
    animalsPages,
  }) => {
    const bosTaurus = animalsPages.animalIdentification.speciesCard(commodityLines.cattle.latinName);
    const bisonBison = animalsPages.animalIdentification.speciesCard(commodityLines.bison.latinName);
    await bisonBison.getByLabel('Ear tag', { exact: true }).fill(EAR_TAG_ONE_OVER_LIMIT);
    await bosTaurus.getByLabel('Ear tag', { exact: true }).fill('UK000000000001');
    await bosTaurus.getByRole('button', { name: 'Save and add another' }).click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toHaveCount(0);
    await expect(animalsPages.animalIdentification.savedAnimalRow(commodityLines.cattle.latinName, 1)).toBeVisible();
    await expect(bisonBison.getByLabel('Ear tag', { exact: true })).toHaveValue('');
  });

  test('saves the card typed in when Enter is pressed in its field and stays on Identification details', async ({ animalsPages }) => {
    const { cattle } = commodityLines;
    const bosTaurus = animalsPages.animalIdentification.speciesCard(cattle.latinName);
    const earTag = bosTaurus.getByLabel('Ear tag', { exact: true });
    await earTag.fill('UK000000000001');
    await earTag.press('Enter');

    await expect(animalsPages.animalIdentification.heading).toBeVisible();
    await expect(animalsPages.animalIdentification.savedAnimalRow(cattle.latinName, 1)).toContainText('UK000000000001');
    await expect(animalsPages.animalIdentification.enterDetailsCounterHeading(cattle.latinName, 2, 2)).toBeVisible();
    await expect(earTag).toHaveValue('');
  });

  test('leaves a species of more than one animal unsaved when Save and continue is pressed', async ({ animalsPages }) => {
    const { domesticCat } = commodityLines;
    await animalsPages.animalIdentification.speciesCard(domesticCat.latinName).getByLabel('Passport', { exact: true }).fill('UK123456789');
    await animalsPages.animalIdentification.saveAndContinue.click();
    await expect(animalsPages.overview.heading).toBeVisible();

    await animalsPages.overview.task('Identification details').click();
    const felisCatus = animalsPages.animalIdentification.speciesCard(domesticCat.latinName);
    await expect(animalsPages.animalIdentification.enterDetailsCounterHeading(domesticCat.latinName, 1, 2)).toBeVisible();
    await expect(felisCatus.getByLabel('Passport', { exact: true })).toHaveValue('');
  });

  test('returns from a summary row Change to Identification details listing the commodity added there', async ({ animalsPages }) => {
    const { cattle, bison, domesticCat } = commodityLines;
    await animalsPages.animalIdentification.selectedCommodities.changeLinkFor(cattle).click();
    await expect(animalsPages.commoditySelection.heading).toBeVisible();
    await expect(animalsPages.commoditySelection.selectedSummary).toContainText('3 selected');
    await expect(animalsPages.commoditySelection.selectedSummary).toContainText(cattle.latinName);
    await expect(animalsPages.commoditySelection.selectedSummary).toContainText(bison.latinName);
    await expect(animalsPages.commoditySelection.selectedSummary).toContainText(domesticCat.latinName);

    await animalsPages.commoditySelection.searchAndCheckSpecies([commodityLines.domesticDog]);
    await animalsPages.commoditySelection.saveAndContinue.click();

    await expect(animalsPages.animalIdentification.heading).toBeVisible();
    await expect(animalsPages.animalIdentification.selectedCommodities.bodyRows).toContainText([
      commodityLines.cattle.commodityCode,
      commodityLines.domesticDog.latinName,
      commodityLines.domesticCat.latinName,
    ]);
  });

  test('returns from a summary row Change to Identification details listing only the commodities left after one is deselected', async ({
    animalsPages,
  }) => {
    await animalsPages.animalIdentification.selectedCommodities.changeLinkFor(commodityLines.domesticCat).click();
    await expect(animalsPages.commoditySelection.heading).toBeVisible();

    await animalsPages.commoditySelection.search(commodityLines.domesticCat.searchTerm);
    await animalsPages.commoditySelection.species(commodityLines.domesticCat).uncheck();
    await animalsPages.commoditySelection.saveAndContinue.click();

    await expect(animalsPages.animalIdentification.heading).toBeVisible();
    await expect(animalsPages.animalIdentification.selectedCommodities.bodyRows).toContainText([commodityLines.cattle.commodityCode]);
  });
});
