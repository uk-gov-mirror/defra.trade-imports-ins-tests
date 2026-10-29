import { type Locator, type Page } from '@playwright/test';
import type { CommoditySpecies } from '@domain/animals/constants/commodity-species';

export class SelectedCommoditiesTable {
  constructor(private readonly page: Page) {}

  get table(): Locator {
    return this.page.getByRole('table', { name: 'Selected commodities' });
  }

  get bodyRows(): Locator {
    return this.table.locator('tbody').getByRole('row');
  }

  rowFor(species: CommoditySpecies): Locator {
    return this.table
      .getByRole('row')
      .filter({ has: this.page.getByRole('cell', { name: species.commodityCode, exact: true }) })
      .filter({ hasText: species.latinName });
  }

  changeLinkFor(species: CommoditySpecies): Locator {
    return this.rowFor(species).getByRole('link', { name: new RegExp(`^Change\\s+${species.commodityCode}\\b`) });
  }

  codeCell(row: Locator): Locator {
    return row.getByRole('cell').nth(0);
  }

  speciesCell(row: Locator): Locator {
    return row.getByRole('cell').nth(1);
  }

  animalCountCell(row: Locator): Locator {
    return row.getByRole('cell').nth(2);
  }
}
