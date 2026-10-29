import type { APIRequestContext } from '@playwright/test';
import { expect } from '@fixtures';
import { AddressBookApiClient } from '@adapters/http/address-book-api-client';
import { expectAddressBookList } from './expect-address-book-list';
import { traderAddress } from '@domain/ins/constants/trader-address';

type AddressBookListPages = Parameters<typeof expectAddressBookList>[0];

export const expectOtherOrganisationAddressReturnsToList = async (
  { pages, insPages, request }: AddressBookListPages & { request: APIRequestContext },
  openAddressPage: (addressId: string) => Promise<void>,
): Promise<void> => {
  const otherOrganisationAddressBookApi = new AddressBookApiClient(request, 'e2e-dead-link-other-org');
  const name = `Other Org Farm ${Date.now()}`;
  const created = await otherOrganisationAddressBookApi.createAddress(traderAddress(name));

  try {
    await openAddressPage(created.id);

    await expectAddressBookList({ pages, insPages });
    await expect(pages.page.getByText(name)).toHaveCount(0);
  } finally {
    await otherOrganisationAddressBookApi.deleteAddress(created.id);
  }
};
