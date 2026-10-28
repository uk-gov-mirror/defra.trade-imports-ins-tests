import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/shared/base-page';
import type { CommodityLine } from '@domain/animals/constants/commodity-lines';
import { SEARCH_HINT } from '@domain/animals/constants/commodity-selection-page';

export class AnimalsCommoditySelectionPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'commodities');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'What are you importing?' });
  }

  get itahcInset(): Locator {
    return this.page.getByText(
      'You must submit a separate notification for every single ITAHC. You must also submit a notification for goods that do not need an ITAHC.',
      { exact: true },
    );
  }

  get searchBox(): Locator {
    return this.page.getByLabel('Search for a commodity');
  }

  get searchHint(): Locator {
    return this.page.getByText(SEARCH_HINT, {
      exact: true,
    });
  }

  get searchButton(): Locator {
    return this.page.getByRole('button', { name: 'Search', exact: true });
  }

  get selectedSummary(): Locator {
    return this.page.locator('#commodity-selection');
  }

  get clearAll(): Locator {
    return this.page.getByRole('button', { name: 'Clear all' });
  }

  get commodityCodeHelp(): Locator {
    return this.page.getByText('Help with commodity codes', { exact: true });
  }

  get tradeTariffLink(): Locator {
    return this.page.getByRole('link', { name: 'Trade Tariff tool (opens in a new tab)', exact: true });
  }

  async search(query: string): Promise<void> {
    await this.searchBox.fill(query);
    await this.searchButton.click();
  }

  commodityGroup(code: string): Locator {
    return this.page.getByRole('group', { name: code, exact: true });
  }

  species(line: CommodityLine): Locator {
    return this.commodityGroup(line.commodityCode).getByRole('checkbox', { name: line.latinName, exact: true });
  }

  async searchAndCheckSpecies(lines: CommodityLine[]): Promise<void> {
    for (const line of lines) {
      await this.search(line.searchTerm);
      await this.species(line).check();
    }
  }

  get errorSummary(): Locator {
    return this.page.getByRole('heading', { level: 2, name: 'There is a problem' });
  }
}
