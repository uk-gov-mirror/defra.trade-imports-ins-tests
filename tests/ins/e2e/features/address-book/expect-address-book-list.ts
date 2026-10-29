import { expect } from '@fixtures';
import type { Page, Locator } from '@playwright/test';
import type { InsAddressBookListPage } from '@page-objects/ins/address-book/list-page';

export const expectAddressBookList = async ({
  pages: { page },
  insPages: { addressBookList },
}: {
  pages: { page: Page };
  insPages: { addressBookList: { expectedUrl: string; heading: Locator } };
}): Promise<void> => {
  await expect(page).toHaveURL(new RegExp(`${addressBookList.expectedUrl}$`));
  await expect(addressBookList.heading).toBeVisible();
  await expect(page.getByText('Page not found')).toHaveCount(0);
};

export const expectNoMatchesListed = async (addressBookList: InsAddressBookListPage): Promise<void> => {
  await expect(addressBookList.resultsLine).toHaveText('Showing 0 of 0');
  await expect(addressBookList.columnHeaders).toHaveText(['Name', 'Address', 'Country', 'Action']);
  await expect(addressBookList.bodyRows).toHaveCount(0);
  await expect(addressBookList.mainLinks).toHaveText(['Clear search']);
};
