import { test, expect, type PageFixtures } from '@fixtures';
import { expectAddressBookList, expectNoMatchesListed } from './expect-address-book-list';
import { type AddressDetails } from '@page-objects/ins/address-book/form-page';
import { addFormAddressWithLineTwoAndCounty, addressWithLineTwoAndCounty, traderAddress } from '@domain/ins/constants/trader-address';

const SUBMIT_METHODS = [
  { submitWith: 'button', how: 'the Search button' },
  { submitWith: 'enter', how: 'Enter in the Search field' },
] as const;

const SEARCHED_ADDRESS_FIELDS = [
  { field: 'addressLine2', label: 'address line 2' },
  { field: 'county', label: 'county' },
] as const;

const LINE_TWO_AND_COUNTY_ADDRESS_CELL = /^1 Trader Lane,\nUnit 9,\nCarlisle,\nCumbria,\nCA1 3CC$/;

const addAddressAndExpectSearchToListIt = async (
  { insPages, addressBookApi }: Pick<PageFixtures, 'insPages' | 'addressBookApi'>,
  name: string,
  submitWith: 'button' | 'enter',
) => {
  await addressBookApi.createAddress(traderAddress(name));
  await insPages.addressBookList.open();

  await insPages.addressBookList.search(name, { submitWith });

  await expect(insPages.addressBookList.resultsLine).toHaveText('Showing 1-1 of 1');
  await expect(insPages.addressBookList.bodyRows).toHaveCount(1);
  await expect(insPages.addressBookList.row(name)).toBeVisible();
  await expect(insPages.addressBookList.mainLinks).toHaveText(['Clear search', `View ${name}`]);
};

const addAddressThroughForm = async ({ insPages }: Pick<PageFixtures, 'insPages'>, details: AddressDetails) => {
  await insPages.addressBookList.open();
  await insPages.addressBookList.btnAddNewAddress.click();
  await insPages.addressBookAdd.fill(details);
  await insPages.addressBookAdd.save();
};

test.describe('Address book list', () => {
  test('shows the intro and Add a new address, with the Search field hidden until Filter addresses is opened', async ({ insPages }) => {
    await insPages.addressBookList.open();

    await expect(insPages.addressBookList.intro).toBeVisible();
    await expect(insPages.addressBookList.btnAddNewAddress).toBeVisible();
    await expect(insPages.addressBookList.inputSearch).toBeHidden();
    await insPages.addressBookList.filterSummary.click();
    await expect(insPages.addressBookList.inputSearch).toBeVisible();
  });

  for (const { submitWith, how } of SUBMIT_METHODS) {
    test(`a search submitted with ${how} lists the address it matches`, async ({ insPages, addressBookApi }) => {
      await addAddressAndExpectSearchToListIt({ insPages, addressBookApi }, `Searchable${submitWith}${Date.now()}`, submitWith);
    });
  }

  test('a search matching nothing shows Showing 0 of 0, the column headers, no rows and Clear search as the only link', async ({
    insPages,
  }) => {
    await insPages.addressBookList.open();

    await insPages.addressBookList.search(`NoMatch${Date.now()}`, { submitWith: 'button' });

    await expectNoMatchesListed(insPages.addressBookList);
  });

  test('an address is found from the dashboard, viewed, kept on No, cancel, then deleted on Yes, delete and no longer found by search', async ({
    insPages,
    addressBookApi,
  }) => {
    const name = `Walk Through Farm ${Date.now()}`;
    await addressBookApi.createAddress(traderAddress(name));

    await insPages.dashboard.open();
    await insPages.dashboard.linkAddressBook.click();
    await insPages.addressBookList.search(name, { submitWith: 'button' });
    await expect(insPages.addressBookList.resultsLine).toHaveText('Showing 1-1 of 1');
    await insPages.addressBookList.viewLink(name).click();
    await expect(insPages.addressBookView.heading(name)).toBeVisible();
    await insPages.addressBookView.btnDelete.click();
    await expect(insPages.addressBookDelete.heading).toBeVisible();
    await insPages.addressBookDelete.cancel();
    await expect(insPages.addressBookView.heading(name)).toBeVisible();
    await insPages.addressBookView.btnDelete.click();
    await insPages.addressBookDelete.confirm();

    await expect(insPages.addressBookList.successBanner).toContainText(`${name} address deleted`);
    await insPages.addressBookList.search(name, { submitWith: 'button' });
    await expectNoMatchesListed(insPages.addressBookList);
  });

  test('lists 8 addresses a page and the rest on the next page', async ({ insPages, addressBookApi }) => {
    const stamp = Date.now();
    await Promise.all(
      Array.from({ length: 9 }, (_, index) => addressBookApi.createAddress(traderAddress(`Paged Farm ${stamp} number ${index}`))),
    );
    await insPages.addressBookList.open();

    await insPages.addressBookList.search(`Paged Farm ${stamp}`, { submitWith: 'button' });

    await expect(insPages.addressBookList.resultsLine).toHaveText('Showing 1-8 of 9');
    await expect(insPages.addressBookList.bodyRows).toHaveCount(8);
    await insPages.addressBookList.pageLink(2).click();
    await expect(insPages.addressBookList.resultsLine).toHaveText('Showing 9-9 of 9');
    await expect(insPages.addressBookList.bodyRows).toHaveCount(1);
  });

  for (const { field, label } of SEARCHED_ADDRESS_FIELDS) {
    test(`a search finds an address by a lower-case word inside its ${label}`, async ({ insPages, addressBookApi }) => {
      const stamp = Date.now();
      const name = `${label} Farm ${stamp}`;
      const searchedWord = `Searchable${field}${stamp}`;
      await addressBookApi.createAddress(addressWithLineTwoAndCounty(name, { [field]: `North ${searchedWord} Side` }));
      await insPages.addressBookList.open();

      await insPages.addressBookList.search(searchedWord.toLowerCase(), { submitWith: 'button' });

      await expect(insPages.addressBookList.resultsLine).toHaveText('Showing 1-1 of 1');
      await expect(insPages.addressBookList.row(name)).toBeVisible();
    });
  }

  test('a multi-word name shows its first word then the rest on two lines, and a one-word name on one line', async ({
    insPages,
    addressBookApi,
  }) => {
    const stamp = Date.now();
    const multiWordName = `Green valley farm ${stamp}`;
    const oneWordName = `Hollin${stamp}`;
    await addressBookApi.createAddress(traderAddress(multiWordName));
    await addressBookApi.createAddress(traderAddress(oneWordName));
    await insPages.addressBookList.open();

    await insPages.addressBookList.search(multiWordName, { submitWith: 'button' });

    await expect(insPages.addressBookList.nameCell(multiWordName)).toHaveText(new RegExp(`^Green\\nvalley farm ${stamp}$`), {
      useInnerText: true,
    });
    await insPages.addressBookList.search(oneWordName, { submitWith: 'button' });
    await expect(insPages.addressBookList.nameCell(oneWordName)).toHaveText(new RegExp(`^Hollin${stamp}$`), {
      useInnerText: true,
    });
  });

  test('each stored address line shows on its own line, each but the last ending in a comma, with blank lines left out', async ({
    insPages,
    addressBookApi,
  }) => {
    const stamp = Date.now();
    const fiveLineName = `Lines ${stamp} fiveline`;
    const threeLineName = `Lines ${stamp} threeline`;
    await addressBookApi.createAddress(addressWithLineTwoAndCounty(fiveLineName));
    await addressBookApi.createAddress(traderAddress(threeLineName));
    await insPages.addressBookList.open();

    await insPages.addressBookList.search(`Lines ${stamp}`, { submitWith: 'button' });

    await expect(insPages.addressBookList.addressCell(fiveLineName)).toHaveText(LINE_TWO_AND_COUNTY_ADDRESS_CELL, {
      useInnerText: true,
    });
    await expect(insPages.addressBookList.addressCell(threeLineName)).toHaveText(/^1 Trader Lane,\nCarlisle,\nCA1 3CC$/, {
      useInnerText: true,
    });
  });

  test('an address added through the form lands on the list with its success banner, its address and country, and a View link to its own page', async ({
    pages,
    insPages,
  }) => {
    const name = `Added Farm ${Date.now()}`;

    await addAddressThroughForm({ insPages }, addFormAddressWithLineTwoAndCounty(name, 'France'));

    await expectAddressBookList({ pages, insPages });
    await expect(
      insPages.addressBookList.successBanner.getByText(`${name} address added to your address book`, { exact: true }),
    ).toBeVisible();
    await insPages.addressBookList.search(name, { submitWith: 'button' });

    await expect(insPages.addressBookList.resultsLine).toHaveText('Showing 1-1 of 1');
    await expect(insPages.addressBookList.addressCell(name)).toHaveText(LINE_TWO_AND_COUNTY_ADDRESS_CELL, {
      useInnerText: true,
    });
    await expect(insPages.addressBookList.countryCell(name)).toHaveText('France');
    await insPages.addressBookList.viewLink(name).click();
    await expect(insPages.addressBookView.heading(name)).toBeVisible();
  });

  test('an address added through the form lands on the list with its success banner, and is listed ahead of an older address', async ({
    insPages,
    addressBookApi,
  }) => {
    const stamp = Date.now();
    const olderName = `Newest first ${stamp} older`;
    const newerName = `Newest first ${stamp} newer`;
    await addressBookApi.createAddress(traderAddress(olderName));

    await addAddressThroughForm({ insPages }, addFormAddressWithLineTwoAndCounty(newerName, 'France'));
    await expect(insPages.addressBookList.successBanner).toContainText(`${newerName} address added to your address book`);
    await insPages.addressBookList.search(`Newest first ${stamp}`, { submitWith: 'button' });

    await expect(insPages.addressBookList.resultsLine).toHaveText('Showing 1-2 of 2');
    await expect(insPages.addressBookList.viewLinks).toHaveText([`View ${newerName}`, `View ${olderName}`]);
  });

  test('an address added through the form is found by a search on its name, part of its address and part of its country name', async ({
    insPages,
  }) => {
    const stamp = Date.now();
    const name = `Findable Farm ${stamp}`;
    const details = { ...addFormAddressWithLineTwoAndCounty(name, 'France'), addressLine1: `${stamp} Drover Lane` };
    await addAddressThroughForm({ insPages }, details);

    for (const term of [name, `${stamp} drover`, 'fran']) {
      await insPages.addressBookList.search(term, { submitWith: 'button' });

      await expect(insPages.addressBookList.row(name)).toBeVisible();
    }
  });

  test('the success banner after an edit is still showing 10 seconds later, and a reload shows no banner', async ({
    pages,
    insPages,
    addressBookApi,
  }) => {
    const name = `Banner Farm ${Date.now()}`;
    const created = await addressBookApi.createAddress(traderAddress(name));
    await pages.page.clock.install();
    await insPages.addressBookEdit.open(created.id);
    await insPages.addressBookEdit.save();

    await expect(insPages.addressBookList.successBanner).toContainText(`${name} address updated`);
    await pages.page.clock.runFor(10_000);
    await expect(insPages.addressBookList.successBanner).toContainText(`${name} address updated`);
    await pages.page.reload();

    await expect(insPages.addressBookList.heading).toBeVisible();
    await expect(insPages.addressBookList.successBanner).toHaveCount(0);
  });
});

test.describe('Address book list without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('Filter addresses opens to show the Search field', async ({ insPages }) => {
    await insPages.addressBookList.open();
    await expect(insPages.addressBookList.inputSearch).toBeHidden();

    await insPages.addressBookList.filterSummary.click();

    await expect(insPages.addressBookList.inputSearch).toBeVisible();
  });

  for (const { submitWith, how } of SUBMIT_METHODS) {
    test(`a search submitted with ${how} and JavaScript is off lists the address it matches`, async ({ insPages, addressBookApi }) => {
      await addAddressAndExpectSearchToListIt({ insPages, addressBookApi }, `Scriptless${submitWith}${Date.now()}`, submitWith);
    });
  }
});
