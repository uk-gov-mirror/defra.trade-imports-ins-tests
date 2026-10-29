import { test, expect } from '@fixtures';
import { COLD_START } from '@fixtures/auth-state';
import { createInsPages } from '@page-objects';
import { users } from '@config/users';
import { urlWithReturn } from '@page-objects/ins/address-book/url-with-return';
import { expectAddressBookList, expectNoMatchesListed } from './expect-address-book-list';
import { UNKNOWN_ADDRESS_ID } from './unknown-address-id';
import { addressWithLineTwoAndCounty, traderAddress } from '@domain/ins/constants/trader-address';

test.describe('Address book delete', () => {
  test('deleting through the UI tombstones the record rather than removing it', async ({ pages, insPages, addressBookApi }) => {
    const name = `Delete Test Farm ${Date.now()}`;
    const created = await addressBookApi.createAddress(traderAddress(name));

    await insPages.addressBookDelete.open(created.id);
    await expect(insPages.addressBookDelete.heading).toBeVisible();
    await insPages.addressBookDelete.confirm();

    await expect(pages.page).toHaveURL(new RegExp(`${insPages.addressBookList.expectedUrl}$`));
    await expect(insPages.addressBookList.successBanner).toContainText(`${name} address deleted`);
    await insPages.addressBookList.search(name, { submitWith: 'button' });
    await expectNoMatchesListed(insPages.addressBookList);

    const tombstone = await addressBookApi.getAddress(created.id);
    expect(tombstone.deleted).toBe(true);
    expect(tombstone.name).toBe(name);
  });

  test('the delete page summarises the address, and No, cancel returns to its details with nothing deleted', async ({
    pages,
    insPages,
    addressBookApi,
  }) => {
    const address = addressWithLineTwoAndCounty(`Delete Summary Farm ${Date.now()}`);
    const created = await addressBookApi.createAddress(address);

    await insPages.addressBookDelete.open(created.id);

    await expect(insPages.addressBookDelete.heading).toBeVisible();
    await expect(insPages.addressBookDelete.summaryListKeys).toHaveText(['Address']);
    await expect(insPages.addressBookDelete.summaryListValues).toHaveText(
      [
        address.name,
        address.addressLine1,
        address.addressLine2,
        address.townOrCity,
        address.county,
        address.postcode,
        'United Kingdom',
      ].join(' '),
      { useInnerText: true },
    );
    await expect(insPages.addressBookDelete.confirmation).toBeVisible();
    await expect(insPages.addressBookDelete.warning).toBeVisible();

    await insPages.addressBookDelete.cancel();

    await expect(pages.page).toHaveURL(new RegExp(`${insPages.addressBookView.expectedUrl(created.id)}$`));
    await expect(insPages.addressBookView.heading(address.name)).toBeVisible();
    expect((await addressBookApi.getAddress(created.id)).deleted).toBe(false);
    await insPages.addressBookList.open();
    await expect(insPages.addressBookList.successBanner).toHaveCount(0);
  });

  test.describe('return', () => {
    test('reached with a return, No, cancel goes to the view page carrying it, and Yes, delete lands on the return', async ({
      pages,
      insPages,
      addressBookApi,
    }) => {
      const created = await addressBookApi.createAddress(traderAddress(`Delete Return Farm ${Date.now()}`));
      const viewHref = urlWithReturn(insPages.addressBookView.expectedUrl(created.id), '/');

      await insPages.addressBookDelete.openWithReturn(created.id, '/');

      await expect(insPages.addressBookDelete.linkCancel).toHaveAttribute('href', viewHref);
      await expect(insPages.addressBookDelete.linkBack).toHaveAttribute('href', viewHref);

      await insPages.addressBookDelete.cancel();
      await expect(pages.page).toHaveURL((url) => url.pathname + url.search === viewHref);

      await insPages.addressBookView.btnDelete.click();
      await insPages.addressBookDelete.confirm();

      await expect(insPages.dashboard.heading).toBeVisible();
      expect((await addressBookApi.getAddress(created.id)).deleted).toBe(true);
    });

    test("a return to the deleted address's own page lands on the address book", async ({ pages, insPages, addressBookApi }) => {
      const name = `Delete Own Page Farm ${Date.now()}`;
      const created = await addressBookApi.createAddress(traderAddress(name));

      await insPages.addressBookDelete.openWithReturn(created.id, `/address-book/${created.id}`);
      await insPages.addressBookDelete.confirm();

      await expectAddressBookList({ pages, insPages });
      await expect(insPages.addressBookList.successBanner).toContainText(`${name} address deleted`);
    });
  });

  test.describe('dead links', () => {
    test("an unknown address id's delete page returns to the address book", async ({ pages, insPages }) => {
      await insPages.addressBookDelete.open(UNKNOWN_ADDRESS_ID);

      await expectAddressBookList({ pages, insPages });
    });

    test("a deleted address's delete page returns to the address book", async ({ pages, insPages, addressBookApi }) => {
      const created = await addressBookApi.createAddress(traderAddress(`Deleted Delete Farm ${Date.now()}`));
      await addressBookApi.deleteAddress(created.id);

      await insPages.addressBookDelete.open(created.id);

      await expectAddressBookList({ pages, insPages });
    });

    test('a stale delete changes nothing and shows no banner', async ({ pages, insPages, addressBookApi }) => {
      const name = `Stale Delete Farm ${Date.now()}`;
      const created = await addressBookApi.createAddress(traderAddress(name));
      await insPages.addressBookDelete.open(created.id);
      await addressBookApi.deleteAddress(created.id);

      await insPages.addressBookDelete.confirm();

      await expectAddressBookList({ pages, insPages });
      await expect(insPages.addressBookList.successBanner).toHaveCount(0);
      await expect
        .poll(async () => {
          const { deleted, name: storedName } = await addressBookApi.getAddress(created.id);
          return { deleted, name: storedName };
        })
        .toEqual({ deleted: true, name });
    });
  });

  test('an address deleted by one user is gone for another in the same organisation', async ({
    browser,
    pages,
    insPages,
    addressBookApi,
  }) => {
    const name = `Delete Cross User Farm ${Date.now()}`;
    const created = await addressBookApi.createAddress(traderAddress(name));

    await insPages.addressBookDelete.open(created.id, { userId: users.andrew.crn });
    await insPages.addressBookDelete.confirm();
    await expect(pages.page).toHaveURL(new RegExp(`${insPages.addressBookList.expectedUrl}$`));
    expect((await addressBookApi.getAddress(created.id)).deleted).toBe(true);
    await insPages.addressBookList.search(name, { submitWith: 'button' });
    await expectNoMatchesListed(insPages.addressBookList);

    const sarahContext = await browser.newContext({ storageState: COLD_START });
    try {
      const sarahInsPages = createInsPages(await sarahContext.newPage());

      await sarahInsPages.addressBookList.open({
        userId: users.sarah.crn,
        organisationSbi: users.sarah.organisations.gatwickAirport,
      });

      await sarahInsPages.addressBookList.search(name, { submitWith: 'button' });
      await expectNoMatchesListed(sarahInsPages.addressBookList);
    } finally {
      await sarahContext.close();
    }
  });
});
