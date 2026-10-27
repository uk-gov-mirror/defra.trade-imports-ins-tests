import { test, expect } from '@fixtures';
import { SEARCH_HINT, SELECT_COMMODITY_ERROR } from '@domain/animals/constants/commodity-selection-page';

const expectedGroups = [
  ['Cow (0102)', '0102', ['Bison bison', 'Bos spp.', 'Bos taurus', 'Bubalus bubalis']],
  ['Horse (0101)', '0101', ['Equus caballus']],
  ['Cat (01061900)', '01061900', ['Felis catus']],
  ['Dog (01061900)', '01061900', ['Canis lupus familiaris']],
  ['Fish (0301)', '0301', ['Salmo salar']],
] as const;

const SEARCH_BOX_DESCRIPTION_WITH_ERROR = `${SEARCH_HINT} Error: ${SELECT_COMMODITY_ERROR}`;

test.describe('Commodity selection page', { tag: '@duplicated-in-frontend' }, () => {
  test.beforeEach(async ({ animalsJourney }) => {
    await animalsJourney.toCommoditySelection();
  });

  test('offers a search box and lists nothing until it is used', async ({ pages, animalsPages }) => {
    await expect(animalsPages.commoditySelection.heading).toBeVisible();
    await expect(animalsPages.commoditySelection.searchBox).toBeVisible();
    await expect(pages.page.getByRole('checkbox')).toHaveCount(0);
    await expect(animalsPages.commoditySelection.selectedSummary).toHaveCount(0);
    await expect(animalsPages.commoditySelection.saveAndContinue).toBeVisible();
  });

  test('shows the ITAHC inset and the search hint', async ({ animalsPages }) => {
    await expect(animalsPages.commoditySelection.itahcInset).toBeVisible();
    await expect(animalsPages.commoditySelection.searchHint).toBeVisible();
  });

  test('explains commodity codes and links out to the Trade Tariff tool', async ({ animalsPages }) => {
    await animalsPages.commoditySelection.commodityCodeHelp.click();

    await expect(animalsPages.commoditySelection.tradeTariffLink).toBeVisible();
    await expect(animalsPages.commoditySelection.tradeTariffLink).toHaveAttribute('href', 'https://www.gov.uk/trade-tariff');
    await expect(animalsPages.commoditySelection.tradeTariffLink).toHaveAttribute('target', '_blank');
  });

  test('lists nothing for a query shorter than three characters', async ({ pages, animalsPages }) => {
    await animalsPages.commoditySelection.search('Bo');
    await expect(pages.page.getByRole('checkbox')).toHaveCount(0);
  });

  test('groups the matching species under their commodity heading', async ({ pages, animalsPages }) => {
    for (const [legend, query, species] of expectedGroups) {
      await animalsPages.commoditySelection.search(query);
      const group = pages.page.getByRole('group', { name: legend });
      await expect(group).toBeVisible();
      for (const name of species) {
        await expect(group.getByRole('checkbox', { name })).toBeVisible();
      }
    }
  });

  test('says so when nothing matches', async ({ pages, animalsPages }) => {
    await animalsPages.commoditySelection.search('zzz');
    await expect(pages.page.getByText('No results found')).toBeVisible();
    await expect(pages.page.getByRole('checkbox')).toHaveCount(0);
  });

  test('accepts and persists multiple commodity-species pairs found under different queries', async ({ pages, animalsPages }) => {
    test.slow();

    await animalsPages.commoditySelection.selectSpecies(['Bos taurus', 'Felis catus']);
    await animalsPages.commoditySelection.saveAndContinue.click();
    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toHaveCount(0);

    await expect(animalsPages.overview.heading).toBeVisible();
    await animalsPages.overview.task('What are you importing?').click();

    await expect(animalsPages.commoditySelection.selectedSummary).toContainText('2 selected');
    await expect(animalsPages.commoditySelection.selectedSummary).toContainText('Bos taurus');
    await expect(animalsPages.commoditySelection.selectedSummary).toContainText('Felis catus');

    await animalsPages.commoditySelection.search('Bos taurus');
    await expect(animalsPages.commoditySelection.species('Bos taurus')).toBeChecked();
    await animalsPages.commoditySelection.search('Felis catus');
    await expect(animalsPages.commoditySelection.species('Felis catus')).toBeChecked();
  });

  test('counts what has been chosen and clears it on request', async ({ animalsPages }) => {
    await animalsPages.commoditySelection.selectSpecies(['Bos taurus']);
    await animalsPages.commoditySelection.search('Salmo');
    await expect(animalsPages.commoditySelection.selectedSummary).toContainText('1 selected');
    await expect(animalsPages.commoditySelection.selectedSummary).toContainText('Bos taurus');

    await animalsPages.commoditySelection.clearAll.click();
    await expect(animalsPages.commoditySelection.selectedSummary).toHaveCount(0);
  });

  test('shows an error on the search box when submitted empty', async ({ animalsPages }) => {
    await animalsPages.commoditySelection.saveAndContinue.click();

    await expect(animalsPages.commoditySelection.errorSummary).toBeVisible();
    await expect(animalsPages.commoditySelection.errorSummaryLinks).toHaveText([SELECT_COMMODITY_ERROR]);
    await expect(animalsPages.commoditySelection.searchBox).toHaveAccessibleDescription(SEARCH_BOX_DESCRIPTION_WITH_ERROR);
    await animalsPages.commoditySelection.errorSummaryLinks.click();
    await expect(animalsPages.commoditySelection.searchBox).toBeFocused();
  });

  test('with results listed, keeps the "Select a commodity" error on the search box', async ({ animalsPages }) => {
    await animalsPages.commoditySelection.search('Bos');
    await animalsPages.commoditySelection.saveAndContinue.click();

    await expect(animalsPages.commoditySelection.errorSummaryLinks).toHaveText([SELECT_COMMODITY_ERROR]);
    await expect(animalsPages.commoditySelection.searchBox).toHaveAccessibleDescription(SEARCH_BOX_DESCRIPTION_WITH_ERROR);
    await expect(animalsPages.commoditySelection.group('Cow (0102)')).toBeVisible();
    await animalsPages.commoditySelection.errorSummaryLinks.click();
    await expect(animalsPages.commoditySelection.searchBox).toBeFocused();
  });

  test.describe('after a saved selection is cleared and save and return to overview is chosen', () => {
    test.beforeEach(async ({ animalsPages }) => {
      await animalsPages.commoditySelection.selectSpecies(['Bos taurus']);
      await animalsPages.commoditySelection.saveAndContinue.click();
      await expect(animalsPages.overview.heading).toBeVisible();
      await animalsPages.overview.task('What are you importing?').click();
      await animalsPages.commoditySelection.clearAll.click();
      await animalsPages.commoditySelection.saveAndReturnToOverview.click();
    });

    test('refuses the save with "Select a commodity" and stays on the page', async ({ animalsPages }) => {
      await expect(animalsPages.commoditySelection.heading).toBeVisible();
      await expect(animalsPages.commoditySelection.errorSummaryLinks).toHaveText([SELECT_COMMODITY_ERROR]);
      await expect(animalsPages.commoditySelection.selectedSummary).toHaveCount(0);
    });

    test('keeps the saved selection when the page is reopened', async ({ animalsPages }) => {
      const referenceNumber = animalsPages.commoditySelection.referenceNumberFromUrl();
      await animalsPages.overview.openTaskAfterReopening(referenceNumber, 'What are you importing?');
      await expect(animalsPages.commoditySelection.selectedSummary).toContainText('Bos taurus');
    });
  });
});
