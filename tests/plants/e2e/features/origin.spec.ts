import { test, expect } from '@fixtures';
import { PLANTS_FOR_PLANTING, POTATOES, WOOD_AND_CUT_TREES } from '@flows/plants/journey';
import { ORIGIN_COUNTRY_SEARCH_PLACEHOLDER, ORIGIN_COUNTRY_SELECT_TEXT } from '@domain/plants/constants/origin-page';
import { SEARCH_BOX_ASSISTIVE_DESCRIPTION } from '@domain/shared/constants/type-ahead';

const WARE_POTATOES = 'Ware potatoes';
const CONIFER_WOOD_WITHOUT_BARK = 'Conifer wood without bark (from Italy, France, Portugal or Spain)';

const ORIGIN_TASK_ROW = 'Where is this consignment coming from?';

const FRANCE = 'France';
const GERMANY = 'Germany';
const ITALY = 'Italy';
const NORWAY = 'Norway';
const SPAIN = 'Spain';

const WARE_POTATO_GUIDANCE =
  'Notify ware potatoes grown, or suspected to have been grown, in Poland, Portugal, Romania or Spain. Spain does not include the Balearic Islands.';

const WARE_POTATO_ERROR = 'Select Poland, Portugal, Romania or Spain – ware potatoes from other countries do not need to be notified';
const CONIFER_WOOD_ERROR =
  'Select Italy, France, Portugal or Spain – conifer wood without bark from other countries does not need to be notified';
const EU_MEMBER_STATE_ERROR = 'Select an EU member state – plants and wood from other countries do not need to be notified';

const COUNTRY_REQUIRED_ERROR = 'Select the country where the consignment originates from';

const wareLine = {
  category: WARE_POTATOES,
  line: { Variety: 'King Edward', Quantity: '250', 'Intended use': 'Eating' },
};

const coniferWoodWithoutBarkLine = {
  category: CONIFER_WOOD_WITHOUT_BARK,
  line: {
    'Commodity code': '4403 25 10',
    Quantity: '40',
    'Phytosanitary treatments applied': 'Kiln dried (KD)',
  },
};

test.describe('High-risk plants origin section', () => {
  test('a country picked from the type-ahead is saved and shown again on return', async ({ pages, plantsPages, plantsJourney }) => {
    const reference = await plantsJourney.toOriginOfNewNotification(POTATOES);

    await expect(pages.page).toHaveURL(plantsPages.origin.expectedUrl(reference));

    await plantsJourney.toArrivalDetails(FRANCE);

    await expect(pages.page).toHaveURL(plantsPages.arrivalDetails.expectedUrl(reference));

    await plantsPages.origin.open(reference);
    await expect(plantsPages.origin.country.field).toHaveValue(FRANCE);
  });

  test('following Back from origin to the commodities list and choosing Save and continue returns to origin, not the overview', async ({
    pages,
    plantsPages,
    plantsJourney,
  }) => {
    const reference = await plantsJourney.toOriginOfNewNotification(POTATOES);

    await plantsPages.origin.linkBack.click();

    await expect(pages.page).toHaveURL(plantsPages.commodities.expectedUrl(reference));

    await plantsPages.commodities.saveAndContinue.click();

    await expect(pages.page).toHaveURL(plantsPages.origin.expectedUrl(reference));
  });

  test('the country search box shows its placeholder and no hint', async ({ plantsPages, plantsJourney }) => {
    await plantsJourney.toOriginOfNewNotification(POTATOES);

    await expect(plantsPages.origin.country.field).toHaveAttribute('placeholder', ORIGIN_COUNTRY_SEARCH_PLACEHOLDER);
    await expect(plantsPages.origin.country.field).toHaveAccessibleDescription(SEARCH_BOX_ASSISTIVE_DESCRIPTION);
    await expect(plantsPages.origin.country.hint).toHaveCount(0);
  });

  test('a country suggestion shows the letters typed in bold', async ({ plantsPages, plantsJourney }) => {
    await plantsJourney.toOriginOfNewNotification(POTATOES);

    await plantsPages.origin.country.search('fra');

    await expect(plantsPages.origin.country.boldLettersOf(FRANCE)).toHaveText(['Fra']);
  });

  test('typing an accented country name offers the country listed without the accent, with its letters in bold', async ({
    plantsPages,
    plantsJourney,
  }) => {
    await plantsJourney.toOriginOfNewNotification(POTATOES);

    const typedCountry = 'Réunion';
    const listedCountry = 'Reunion';

    await plantsPages.origin.country.search(typedCountry);

    await expect(plantsPages.origin.country.boldLettersOf(listedCountry)).toHaveText([listedCountry]);
  });

  test('a seed-potato consignment may name any country in the origin block', async ({ pages, plantsPages, plantsJourney }) => {
    const reference = await plantsJourney.toOriginOfNewNotification(POTATOES);

    await expect(plantsPages.origin.guidance).toHaveCount(0);

    await plantsPages.origin.country.choose(NORWAY);
    await plantsPages.origin.saveAndContinue.click();

    await expect(pages.page).toHaveURL(plantsPages.arrivalDetails.expectedUrl(reference));
  });

  test('a ware-potato consignment is narrowed to Poland, Portugal, Romania or Spain', async ({ pages, plantsPages, plantsJourney }) => {
    const reference = await plantsJourney.toOriginOfNewNotification(POTATOES, wareLine);

    await expect(plantsPages.origin.guidance).toHaveText(WARE_POTATO_GUIDANCE);

    await plantsPages.origin.country.choose(FRANCE);
    await plantsPages.origin.saveAndContinue.click();

    await expect(pages.page).toHaveURL(plantsPages.origin.expectedUrl(reference));
    await expect(plantsPages.origin.errorSummary).toContainText(WARE_POTATO_ERROR);

    await plantsPages.origin.country.choose(SPAIN);
    await plantsPages.origin.saveAndContinue.click();

    await expect(pages.page).toHaveURL(plantsPages.arrivalDetails.expectedUrl(reference));
  });

  test('a conifer-wood-without-bark line is narrowed to Italy, France, Portugal or Spain', async ({
    pages,
    plantsPages,
    plantsJourney,
  }) => {
    const reference = await plantsJourney.toOriginOfNewNotification(WOOD_AND_CUT_TREES, coniferWoodWithoutBarkLine);

    await plantsPages.origin.country.choose(GERMANY);
    await plantsPages.origin.saveAndContinue.click();

    await expect(pages.page).toHaveURL(plantsPages.origin.expectedUrl(reference));
    await expect(plantsPages.origin.errorSummary).toContainText(CONIFER_WOOD_ERROR);

    await plantsPages.origin.country.choose(ITALY);
    await plantsPages.origin.saveAndContinue.click();

    await expect(pages.page).toHaveURL(plantsPages.arrivalStatus.expectedUrl(reference));
    await expect(plantsPages.arrivalStatus.heading).toBeVisible();
  });

  test('a plants-for-planting line is narrowed to the EU member States', async ({ pages, plantsPages, plantsJourney }) => {
    const reference = await plantsJourney.toOriginOfNewNotification(PLANTS_FOR_PLANTING);

    await plantsPages.origin.country.choose(NORWAY);
    await plantsPages.origin.saveAndContinue.click();

    await expect(pages.page).toHaveURL(plantsPages.origin.expectedUrl(reference));
    await expect(plantsPages.origin.errorSummary).toContainText(EU_MEMBER_STATE_ERROR);

    await plantsPages.origin.country.choose(GERMANY);
    await plantsPages.origin.saveAndContinue.click();

    await expect(pages.page).toHaveURL(plantsPages.arrivalStatus.expectedUrl(reference));
    await expect(plantsPages.arrivalStatus.heading).toBeVisible();
  });

  test('the narrowing is enforced at Continue, so a saved country is refused once a ware-potato line joins it', async ({
    pages,
    plantsPages,
    plantsJourney,
  }) => {
    const reference = await plantsJourney.toOriginOfNewNotification(POTATOES);
    await plantsJourney.toArrivalDetails(FRANCE);

    await plantsPages.commodities.open(reference);
    await plantsJourney.addAnotherCommodityLine(wareLine.category, wareLine.line);

    await plantsPages.origin.open(reference);
    await expect(plantsPages.origin.guidance).toHaveText(WARE_POTATO_GUIDANCE);
    await expect(plantsPages.origin.country.field).toHaveValue(FRANCE);

    await plantsPages.origin.saveAndContinue.click();

    await expect(pages.page).toHaveURL(plantsPages.origin.expectedUrl(reference));
    await expect(plantsPages.origin.errorSummary).toContainText(WARE_POTATO_ERROR);
  });

  test('the required error names the consignment, not the animal', async ({ pages, plantsPages, plantsJourney }) => {
    const reference = await plantsJourney.toOriginOfNewNotification(POTATOES);

    await plantsPages.origin.saveAndContinue.click();

    await expect(pages.page).toHaveURL(plantsPages.origin.expectedUrl(reference));
    await expect(plantsPages.origin.errorSummary).toContainText(COUNTRY_REQUIRED_ERROR);
    await expect(plantsPages.origin.errorSummary).not.toContainText('animal');
  });

  test('the origin task row reads Completed once a country is saved', async ({ pages, plantsPages, plantsJourney }) => {
    const reference = await plantsJourney.toOriginOfNewNotification(POTATOES);

    await plantsJourney.toArrivalDetails(FRANCE);

    await expect(pages.page).toHaveURL(plantsPages.arrivalDetails.expectedUrl(reference));

    await plantsPages.overview.open(reference);
    await expect(plantsPages.overview.taskRow(ORIGIN_TASK_ROW)).toContainText('Completed');
  });
});

test.describe('High-risk plants origin section without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('shows no hint, begins with Select a country, and saves the chosen country', async ({ pages, plantsPages, plantsJourney }) => {
    const reference = await plantsJourney.toOriginOfNewNotification(POTATOES);
    const { select } = plantsPages.origin.country;

    await expect(plantsPages.origin.country.field).toHaveAccessibleDescription('');
    await expect(plantsPages.origin.country.hint).toHaveCount(0);
    await expect(select.locator('option').first()).toHaveText(ORIGIN_COUNTRY_SELECT_TEXT);

    await select.selectOption({ label: FRANCE });
    await plantsPages.origin.saveAndContinue.click();
    await expect(pages.page).toHaveURL(plantsPages.arrivalDetails.expectedUrl(reference));

    await plantsPages.origin.open(reference);
    await expect(select.locator('option:checked')).toHaveText(FRANCE);
  });
});
