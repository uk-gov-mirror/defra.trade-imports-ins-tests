import { test, WCAG_STANDARD } from '@fixtures/a11y';
import { addFormAddressWithLineTwoAndCounty, addressWithLineTwoAndCounty, traderAddress } from '@domain/ins/constants/trader-address';

test.describe(`Accessibility ${WCAG_STANDARD.name}`, { tag: '@a11y' }, () => {
  test('the add address form has no accessibility violations when fully entered', async ({ insPages, runA11yScan }) => {
    await insPages.addressBookAdd.open();
    await insPages.addressBookAdd.heading.waitFor();
    await insPages.addressBookAdd.fill(addFormAddressWithLineTwoAndCounty(`A11y Filled Farm ${Date.now()}`, 'United Kingdom'));

    await runA11yScan();
  });

  test('the view, edit and delete pages have no accessibility violations for a stored address', async ({
    insPages,
    addressBookApi,
    runA11yScan,
  }) => {
    const name = `A11y Stored Farm ${Date.now()}`;
    const bare = await addressBookApi.createAddress(traderAddress(name));
    const full = await addressBookApi.createAddress(addressWithLineTwoAndCounty(`${name} Full`));

    await test.step('View address (required fields only)', async () => {
      await insPages.addressBookView.open(bare.id);
      await insPages.addressBookView.heading(name).waitFor();
      await runA11yScan();
    });

    await test.step('View address (with address line 2 and county)', async () => {
      await insPages.addressBookView.open(full.id);
      await insPages.addressBookView.heading(`${name} Full`).waitFor();
      await runA11yScan();
    });

    await test.step('Edit address, filled with the stored address', async () => {
      await insPages.addressBookEdit.open(full.id);
      await insPages.addressBookEdit.heading.waitFor();
      await runA11yScan();
    });

    await test.step('Delete address confirmation', async () => {
      await insPages.addressBookDelete.open(full.id);
      await insPages.addressBookDelete.heading.waitFor();
      await runA11yScan();
    });
  });
});
