import { type Locator, type Page } from '@playwright/test';
import type { CommodityLine } from '@domain/animals/constants/commodity-lines';

export class SelectedCommoditiesTable {
  constructor(private readonly page: Page) {}

  get table(): Locator {
    return this.page.getByRole('table', { name: 'Selected commodities' });
  }

  get bodyRows(): Locator {
    return this.table.locator('tbody').getByRole('row');
  }

  rowFor(line: CommodityLine): Locator {
    return this.table
      .getByRole('row')
      .filter({ has: this.page.getByRole('cell', { name: line.commodityCode, exact: true }) })
      .filter({ hasText: line.latinName });
  }

  changeLinkFor(line: CommodityLine): Locator {
    return this.rowFor(line).getByRole('link', { name: new RegExp(`^Change\\s+${line.commodityCode}\\b`) });
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
