import { Locator } from '@playwright/test';
import { BasePage, type OpenOptions } from '@page-objects/shared/base-page';

export class InsAddressBookListPage extends BasePage {
  readonly expectedUrl = '/address-book';

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Address book' });
  }

  get errorSummary(): Locator {
    return this.page.getByRole('heading', { level: 2, name: 'There is a problem' });
  }

  get intro(): Locator {
    return this.page.getByText('Manage your addresses for use across all your import notifications', { exact: true });
  }

  get btnAddNewAddress(): Locator {
    return this.page.getByRole('button', { name: 'Add a new address' });
  }

  get filterSummary(): Locator {
    return this.page.getByText('Filter addresses', { exact: true });
  }

  get inputSearch(): Locator {
    return this.page.getByRole('searchbox', { name: 'Search', exact: true });
  }

  get btnSearch(): Locator {
    return this.page.getByRole('button', { name: 'Search', exact: true });
  }

  get resultsLine(): Locator {
    return this.page.getByTestId('address-book-results-label');
  }

  get columnHeaders(): Locator {
    return this.page.getByRole('columnheader');
  }

  get bodyRows(): Locator {
    return this.page.getByRole('row').filter({ has: this.page.getByRole('cell') });
  }

  get mainLinks(): Locator {
    return this.page.getByRole('main').getByRole('link');
  }

  get successBanner(): Locator {
    return this.page.getByRole('alert').filter({ has: this.page.getByRole('heading', { name: 'Success' }) });
  }

  get pagination(): Locator {
    return this.page.locator('.govuk-pagination');
  }

  get linkNextPage(): Locator {
    return this.pagination.getByRole('link', { name: 'Next page', exact: true });
  }

  row(name: string): Locator {
    return this.page.getByRole('row', { name });
  }

  nameCell(name: string): Locator {
    return this.row(name).getByRole('cell').nth(0);
  }

  addressCell(name: string): Locator {
    return this.row(name).getByRole('cell').nth(1);
  }

  countryCell(name: string): Locator {
    return this.row(name).getByRole('cell').nth(2);
  }

  get viewLinks(): Locator {
    return this.mainLinks.filter({ hasText: /^View / });
  }

  pageLink(pageNumber: number): Locator {
    return this.page.getByRole('link', { name: `Page ${pageNumber}`, exact: true });
  }

  viewLink(name: string): Locator {
    return this.page.getByRole('link', { name: `View ${name}`, exact: true });
  }

  async search(term: string, { submitWith }: { submitWith: 'button' | 'enter' }): Promise<void> {
    await this.filterSummary.click();
    await this.inputSearch.fill(term);
    if (submitWith === 'enter') {
      await this.inputSearch.press('Enter');
    } else {
      await this.btnSearch.click();
    }
  }

  async open({ attemptSignIn = true, ...identity }: OpenOptions = {}): Promise<void> {
    await this.page.goto(this.expectedUrl);
    await this.signInWhenRequested(attemptSignIn, identity);
  }
}
