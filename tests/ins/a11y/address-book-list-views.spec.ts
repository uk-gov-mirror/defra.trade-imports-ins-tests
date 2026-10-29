import { test, expect, WCAG_STANDARD } from '@fixtures/a11y';
import { addFormAddressWithLineTwoAndCounty, traderAddress } from '@domain/ins/constants/trader-address';

test.describe(`Accessibility ${WCAG_STANDARD.name}`, { tag: '@a11y' }, () => {
  test('the address book has no accessibility violations when populated and after an address is added', async ({
    insPages,
    addressBookApi,
    runA11yScan,
  }) => {
    const seededName = `A11y List Farm ${Date.now()}`;
    await addressBookApi.createAddress(traderAddress(seededName));

    await test.step('Address book (populated list)', async () => {
      await insPages.addressBookList.open();
      await expect(insPages.addressBookList.row(seededName)).toBeVisible();
      await runA11yScan();
    });

    await test.step('Address book with the success banner', async () => {
      await insPages.addressBookList.btnAddNewAddress.click();
      await insPages.addressBookAdd.heading.waitFor();
      await insPages.addressBookAdd.fill(addFormAddressWithLineTwoAndCounty(`A11y Added Farm ${Date.now()}`, 'United Kingdom'));
      await insPages.addressBookAdd.save();
      await insPages.addressBookList.successBanner.waitFor();
      await runA11yScan();
    });
  });

  test.describe('pagination', () => {
    test.beforeEach(async ({ insPages }) => {
      await insPages.addressBookList.open();
      const hasPagination = await insPages.addressBookList.pagination.isVisible();
      test.skip(!hasPagination, 'Requires more than one page of addresses.');
    });

    test('the address book has no accessibility violations when paginated', async ({ insPages, runA11yScan }) => {
      await insPages.addressBookList.linkNextPage.click();
      await insPages.addressBookList.heading.waitFor();
      await runA11yScan();
    });
  });
});
