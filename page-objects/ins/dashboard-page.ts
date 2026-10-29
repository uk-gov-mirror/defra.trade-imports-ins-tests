import { type Locator } from '@playwright/test';
import type { DashboardSortValue } from '@domain/ins/constants/dashboard-sort-values';
import { BasePage } from '@page-objects/shared/base-page';

export class InsDashboardPage extends BasePage {
  readonly expectedUrl = '/';

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Dashboard', exact: true });
  }

  get inputReferenceSearch(): Locator {
    return this.page.getByLabel('Search by notification reference');
  }

  get btnSearch(): Locator {
    return this.page.getByRole('button', { name: 'Search', exact: true });
  }

  get noSearchResults(): Locator {
    return this.page.getByTestId('dashboard-no-results');
  }

  get dropdownSort(): Locator {
    return this.page.getByLabel('Sort by');
  }

  get btnUpdateSort(): Locator {
    return this.page.getByRole('button', { name: 'Update sort' });
  }

  get resultsLabel(): Locator {
    return this.page.getByTestId('dashboard-results-label');
  }

  get pagination(): Locator {
    return this.page.locator('.govuk-pagination');
  }

  get linkNextPage(): Locator {
    return this.pagination.getByRole('link', { name: 'Next page', exact: true });
  }

  row(referenceNumber: string): Locator {
    return this.page.getByRole('row', { name: new RegExp(referenceNumber) });
  }

  viewLink(referenceNumber: string): Locator {
    return this.page.getByRole('link', { name: new RegExp(`View.*${referenceNumber}`, 's') });
  }

  async searchForReference(referenceNumber: string): Promise<void> {
    await this.inputReferenceSearch.fill(referenceNumber);
    await this.btnSearch.click();
  }

  async sortBy(sortByValue: DashboardSortValue): Promise<void> {
    await this.dropdownSort.selectOption({ label: sortByValue });
    await this.btnUpdateSort.click();
  }

  async open(attemptSignIn: boolean = true): Promise<void> {
    await this.navigateToInsFrontend(this.expectedUrl);
    await this.signInWhenRequested(attemptSignIn);
    if (attemptSignIn) await this.heading.waitFor();
  }
}
