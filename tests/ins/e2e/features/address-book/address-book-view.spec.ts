import { test, expect } from '@fixtures';
import { expectOtherOrganisationAddressReturnsToList } from './expect-other-organisation-address-returns-to-list';
import { requireBaseUrl } from '@page-objects/shared/base-page';
import { expectAddressBookList } from './expect-address-book-list';
import { MALFORMED_ADDRESS_ID, UNKNOWN_ADDRESS_ID } from './unknown-address-id';
import { addressWithLineTwoAndCounty, traderAddress } from '@domain/ins/constants/trader-address';

test.describe('Address book view', () => {
  test('shows Address line 2 (optional) and County (optional) when the address has them', async ({ insPages, addressBookApi }) => {
    const addressWithOptionalFields = await addressBookApi.createAddress(addressWithLineTwoAndCounty(`View Full Farm ${Date.now()}`));

    await insPages.addressBookView.open(addressWithOptionalFields.id);

    await expect(insPages.addressBookView.summaryListKeys).toHaveText([
      'Name or organisation',
      'Address line 1',
      'Address line 2 (optional)',
      'Town or city',
      'County (optional)',
      'Postcode or Zip code',
      'Country',
      'Email address',
      'Phone number',
    ]);
  });

  test('shows neither Address line 2 nor County when the address has neither', async ({ insPages, addressBookApi }) => {
    const addressWithoutOptionalFields = await addressBookApi.createAddress(traderAddress(`View Bare Farm ${Date.now()}`));

    await insPages.addressBookView.open(addressWithoutOptionalFields.id);

    await expect(insPages.addressBookView.summaryListKeys).toHaveText([
      'Name or organisation',
      'Address line 1',
      'Town or city',
      'Postcode or Zip code',
      'Country',
      'Email address',
      'Phone number',
    ]);
  });

  test.describe('return', () => {
    test('Back follows an INS return, and Edit and Delete carry it on', async ({ insPages, addressBookApi }) => {
      const created = await addressBookApi.createAddress(traderAddress(`View Return Farm ${Date.now()}`));

      await insPages.addressBookView.openWithReturn(created.id, '/');

      await expect(insPages.addressBookView.btnEdit).toHaveAttribute('href', `/address-book/${created.id}/edit?return=%2F`);
      await expect(insPages.addressBookView.btnDelete).toHaveAttribute('href', `/address-book/${created.id}/delete?return=%2F`);

      await insPages.addressBookView.linkBack.click();

      await expect(insPages.dashboard.heading).toBeVisible();
    });

    test('a return on another frontend is ignored', async ({ pages, insPages, addressBookApi }) => {
      const created = await addressBookApi.createAddress(traderAddress(`View Plants Return Farm ${Date.now()}`));
      const plantsOrigin = new URL(requireBaseUrl('TRADE_IMPORTS_PLANTS_FRONTEND_BASE_URL')).origin;

      await insPages.addressBookView.openWithReturn(created.id, `${plantsOrigin}/high-risk-plants`);
      await insPages.addressBookView.linkBack.click();

      await expectAddressBookList({ pages, insPages });
    });
  });

  test.describe('dead links', () => {
    test('an unknown address id carrying an INS return goes back to that return', async ({ insPages }) => {
      await insPages.addressBookView.openWithReturn(UNKNOWN_ADDRESS_ID, '/');

      await expect(insPages.dashboard.heading).toBeVisible();
    });

    test('an unknown address id returns to the address book', async ({ pages, insPages }) => {
      await insPages.addressBookView.open(UNKNOWN_ADDRESS_ID);

      await expectAddressBookList({ pages, insPages });
    });

    test('a malformed address id returns to the address book', async ({ pages, insPages }) => {
      await insPages.addressBookView.open(MALFORMED_ADDRESS_ID);

      await expectAddressBookList({ pages, insPages });
    });

    test("another organisation's address returns to the address book", async ({ pages, insPages, request }) => {
      await expectOtherOrganisationAddressReturnsToList({ pages, insPages, request }, (addressId) =>
        insPages.addressBookView.open(addressId),
      );
    });

    test('a deleted address returns to the address book', async ({ pages, insPages, addressBookApi }) => {
      const created = await addressBookApi.createAddress(traderAddress(`Deleted Farm ${Date.now()}`));
      await addressBookApi.deleteAddress(created.id);

      await insPages.addressBookView.open(created.id);

      await expectAddressBookList({ pages, insPages });
    });
  });
});
