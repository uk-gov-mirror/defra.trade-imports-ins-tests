import { test, expect } from '@fixtures';
import { traderAddress } from '@domain/ins/constants/trader-address';

test.describe('INS page titles', { tag: '@duplicated-in-frontend' }, () => {
  test('the home is titled Dashboard - Import notification service - GOV.UK', async ({ pages, insPages }) => {
    await insPages.dashboard.open();

    await expect(pages.page).toHaveTitle('Dashboard - Import notification service - GOV.UK');
  });

  test('the address book is titled Address book - Import notification service - GOV.UK', async ({ pages, insPages }) => {
    await insPages.addressBookList.open();
    await expect(insPages.addressBookList.heading).toBeVisible();

    await expect(pages.page).toHaveTitle('Address book - Import notification service - GOV.UK');
  });

  test("an address's own page is titled with its name", async ({ pages, insPages, addressBookApi }) => {
    const name = `View Title Farm ${Date.now()}`;
    const created = await addressBookApi.createAddress(traderAddress(name));

    await insPages.addressBookView.open(created.id);

    await expect(pages.page).toHaveTitle(`${name} - Import notification service - GOV.UK`);
  });

  test('the delete page is titled Delete this address?', async ({ pages, insPages, addressBookApi }) => {
    const created = await addressBookApi.createAddress(traderAddress(`Delete Title Farm ${Date.now()}`));

    await insPages.addressBookDelete.open(created.id);

    await expect(pages.page).toHaveTitle('Delete this address? - Import notification service - GOV.UK');
  });

  test('the edit page is titled Edit address and contact details', async ({ pages, insPages, addressBookApi }) => {
    const created = await addressBookApi.createAddress(traderAddress(`Edit Title Farm ${Date.now()}`));

    await insPages.addressBookEdit.open(created.id);

    await expect(pages.page).toHaveTitle('Edit address and contact details - Import notification service - GOV.UK');
  });

  test('a page showing errors opens its title with Error:', async ({ pages, insPages }) => {
    await insPages.addressBookAdd.open();

    await insPages.addressBookAdd.save();

    await expect(insPages.addressBookAdd.errorSummary).toBeVisible();
    await expect(pages.page).toHaveTitle('Error: Add address details - Import notification service - GOV.UK');
  });

  test('a missing page is titled Page not found - Import notification service - GOV.UK', async ({ pages, insPages }) => {
    await insPages.dashboard.open();

    await insPages.dashboard.navigateToInsFrontend('/no-such-page');

    await expect(pages.page).toHaveTitle('Page not found - Import notification service - GOV.UK');
  });
});
