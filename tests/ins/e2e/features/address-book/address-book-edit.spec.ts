import { test, expect } from '@fixtures';
import { expectAddressBookList } from './expect-address-book-list';
import { expectOtherOrganisationAddressReturnsToList } from './expect-other-organisation-address-returns-to-list';
import { MALFORMED_ADDRESS_ID, UNKNOWN_ADDRESS_ID } from './unknown-address-id';
import {
  addressWithLineTwoAndCounty,
  traderAddress,
  traderAddressInUnofferedCountry,
  UNOFFERED_COUNTRY_CODE,
} from '@domain/ins/constants/trader-address';

const FIELD_LABELS_IN_ORDER = [
  'Name or organisation',
  'Address line 1',
  'Address line 2 (optional)',
  'Town or city',
  'County (optional)',
  'Postcode or Zip code',
  'Country',
  'Email address',
  'Phone number',
];

test.describe('Address book edit', () => {
  test('an edit replaces the whole record, clearing the optional fields left blank, and the list confirms it by name', async ({
    pages,
    insPages,
    addressBookApi,
  }) => {
    const originalName = `Edit Test Farm ${Date.now()}`;
    const original = addressWithLineTwoAndCounty(originalName);
    const created = await addressBookApi.createAddress(original);

    const renamed = `${originalName} Renamed`;
    const detailsWithOptionalFieldsBlank = {
      name: renamed,
      addressLine1: original.addressLine1,
      townOrCity: original.townOrCity,
      postcode: original.postcode,
      country: 'United Kingdom',
      phone: original.phone,
      email: original.email,
    };
    await insPages.addressBookEdit.open(created.id);
    await expect(insPages.addressBookEdit.heading).toBeVisible();
    await expect(insPages.addressBookEdit.inputCounty).toHaveValue(original.county);

    await insPages.addressBookEdit.fill(detailsWithOptionalFieldsBlank);
    await insPages.addressBookEdit.save();

    await expect(pages.page).toHaveURL(new RegExp(`${insPages.addressBookList.expectedUrl}$`));
    await expect(insPages.addressBookList.successBanner).toContainText(`${renamed} address updated`);

    const stored = await addressBookApi.getAddress(created.id);
    expect(stored.name).toBe(renamed);
    expect(stored.addressLine2 ?? '').toBe('');
    expect(stored.county ?? '').toBe('');
    expect(stored.townOrCity).toBe(original.townOrCity);
    expect(stored.deleted).toBe(false);
  });

  test('the address book links the new name to the edited address', async ({ insPages, addressBookApi }) => {
    const stamp = Date.now();
    const created = await addressBookApi.createAddress(addressWithLineTwoAndCounty(`Edit Listing Farm ${stamp}`));

    const renamed = `Relisted Holding ${stamp}`;
    await insPages.addressBookEdit.open(created.id);
    await insPages.addressBookEdit.inputName.fill(renamed);
    await insPages.addressBookEdit.save();

    await expect(insPages.addressBookList.viewLink(renamed)).toHaveAttribute('href', `/address-book/${created.id}`);
  });

  test('the edit page is headed Edit address and contact details, with Email address before Phone number and the stored country selected', async ({
    insPages,
    addressBookApi,
  }) => {
    const address = addressWithLineTwoAndCounty(`Edit Layout Farm ${Date.now()}`);
    const created = await addressBookApi.createAddress(address);

    await insPages.addressBookEdit.open(created.id);

    await expect(insPages.addressBookEdit.heading).toBeVisible();
    const textboxNamesInOrder = FIELD_LABELS_IN_ORDER.filter((label) => label !== 'Country');
    for (const [index, name] of textboxNamesInOrder.entries()) {
      await expect(insPages.addressBookEdit.textboxes.nth(index)).toHaveAccessibleName(name);
    }
    await expect(insPages.addressBookEdit.selectCountry).toHaveValue(address.countryCode);
  });

  test('asks only for the address and contact fields', async ({ insPages, addressBookApi }) => {
    const created = await addressBookApi.createAddress(traderAddress(`Edit Fields Farm ${Date.now()}`));

    await insPages.addressBookEdit.open(created.id);

    await expect(insPages.addressBookEdit.fieldLabels).toHaveText(FIELD_LABELS_IN_ORDER);
  });

  test('after a refused save and Cancel, the edit page opens again with no errors and the stored name', async ({
    insPages,
    addressBookApi,
  }) => {
    const name = `Edit Refused Farm ${Date.now()}`;
    const created = await addressBookApi.createAddress(traderAddress(name));
    await insPages.addressBookEdit.open(created.id);
    await insPages.addressBookEdit.inputName.fill('');
    await insPages.addressBookEdit.save();
    await expect(insPages.addressBookEdit.errorSummary).toBeVisible();

    await insPages.addressBookEdit.btnCancel.click();
    await insPages.addressBookEdit.open(created.id);

    await expect(insPages.addressBookEdit.errorSummary).toHaveCount(0);
    await expect(insPages.addressBookEdit.inputName).toHaveValue(name);
  });

  test.describe('opened without a return', () => {
    test('Back opens the address details', async ({ insPages, addressBookApi }) => {
      const name = `Edit Back Farm ${Date.now()}`;
      const created = await addressBookApi.createAddress(traderAddress(name));
      await insPages.addressBookEdit.open(created.id);

      await insPages.addressBookEdit.linkBack.click();

      await expect(insPages.addressBookView.heading(name)).toBeVisible();
    });

    test('Cancel opens the address details and saves nothing', async ({ insPages, addressBookApi }) => {
      const name = `Edit Cancel Farm ${Date.now()}`;
      const created = await addressBookApi.createAddress(traderAddress(name));
      await insPages.addressBookEdit.open(created.id);
      await insPages.addressBookEdit.inputName.fill(`${name} Changed`);

      await insPages.addressBookEdit.btnCancel.click();

      await expect(insPages.addressBookView.heading(name)).toBeVisible();
      expect((await addressBookApi.getAddress(created.id)).name).toBe(name);
    });
  });

  test.describe('opened from the dashboard', () => {
    test('Back opens the dashboard', async ({ insPages, addressBookApi }) => {
      const created = await addressBookApi.createAddress(traderAddress(`Edit Back Return Farm ${Date.now()}`));
      await insPages.addressBookEdit.openWithReturn(created.id, '/');

      await insPages.addressBookEdit.linkBack.click();

      await expect(insPages.dashboard.heading).toBeVisible();
    });

    test('Cancel opens the dashboard and saves nothing', async ({ insPages, addressBookApi }) => {
      const name = `Edit Cancel Return Farm ${Date.now()}`;
      const created = await addressBookApi.createAddress(traderAddress(name));
      await insPages.addressBookEdit.openWithReturn(created.id, '/');
      await insPages.addressBookEdit.inputName.fill(`${name} Changed`);

      await insPages.addressBookEdit.btnCancel.click();

      await expect(insPages.dashboard.heading).toBeVisible();
      expect((await addressBookApi.getAddress(created.id)).name).toBe(name);
    });
  });

  test.describe('dead links', () => {
    test('an unknown address id returns to the address book', async ({ pages, insPages }) => {
      await insPages.addressBookEdit.open(UNKNOWN_ADDRESS_ID);

      await expectAddressBookList({ pages, insPages });
    });

    test('an unknown address id carrying an INS return goes back to that return', async ({ insPages }) => {
      await insPages.addressBookEdit.openWithReturn(UNKNOWN_ADDRESS_ID, '/');

      await expect(insPages.dashboard.heading).toBeVisible();
    });

    test('a malformed address id returns to the address book', async ({ pages, insPages }) => {
      await insPages.addressBookEdit.open(MALFORMED_ADDRESS_ID);

      await expectAddressBookList({ pages, insPages });
    });

    test('an edit opened with a return outside the allow-list goes back to the address view page', async ({
      pages,
      insPages,
      addressBookApi,
    }) => {
      const created = await addressBookApi.createAddress(traderAddress(`Edit Foreign Return Farm ${Date.now()}`));
      const viewUrl = insPages.addressBookView.expectedUrl(created.id);
      await insPages.addressBookEdit.openWithReturn(created.id, 'https://example.com');

      await expect(insPages.addressBookEdit.linkBack).toHaveAttribute('href', viewUrl);
      await insPages.addressBookEdit.btnCancel.click();

      await expect(pages.page).toHaveURL(new RegExp(`${viewUrl}$`));
    });

    test("another organisation's address returns to the address book", async ({ pages, insPages, request }) => {
      await expectOtherOrganisationAddressReturnsToList({ pages, insPages, request }, (addressId) =>
        insPages.addressBookEdit.open(addressId),
      );
    });

    test('a deleted address returns to the address book', async ({ pages, insPages, addressBookApi }) => {
      const created = await addressBookApi.createAddress(traderAddress(`Edit Deleted Farm ${Date.now()}`));
      await addressBookApi.deleteAddress(created.id);

      await insPages.addressBookEdit.open(created.id);

      await expectAddressBookList({ pages, insPages });
    });

    test('saving an address deleted meanwhile returns to the address book and leaves it deleted and unchanged', async ({
      pages,
      insPages,
      addressBookApi,
    }) => {
      const name = `Edit Stale Farm ${Date.now()}`;
      const created = await addressBookApi.createAddress(traderAddress(name));
      await insPages.addressBookEdit.open(created.id);
      await insPages.addressBookEdit.inputName.fill(`${name} Changed`);
      await addressBookApi.deleteAddress(created.id);

      await insPages.addressBookEdit.save();

      await expectAddressBookList({ pages, insPages });
      const { deleted, name: storedName } = await addressBookApi.getAddress(created.id);
      expect({ deleted, name: storedName }).toEqual({ deleted: true, name });
    });
  });

  test.describe('an address whose stored country is not offered', () => {
    test('opens with the Country select on its blank option, and saving without choosing a country shows Select a country and saves nothing', async ({
      insPages,
      addressBookApi,
    }) => {
      const created = await addressBookApi.createAddress(traderAddressInUnofferedCountry(`Edit Unoffered Farm ${Date.now()}`));
      await insPages.addressBookEdit.open(created.id);

      await expect(insPages.addressBookEdit.selectCountry).toHaveValue('');
      await insPages.addressBookEdit.save();

      await expect(insPages.addressBookEdit.errorSummary).toBeVisible();
      await expect(insPages.addressBookEdit.errorSummaryLink('Select a country')).toBeVisible();
      await expect(insPages.addressBookEdit.selectCountry).toHaveAccessibleDescription(/Select a country/);
      expect((await addressBookApi.getAddress(created.id)).countryCode).toBe(UNOFFERED_COUNTRY_CODE);
    });
  });
});
