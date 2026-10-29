import { test, expect, WCAG_STANDARD } from '@fixtures/a11y';
import { traderAddress } from '@domain/ins/constants/trader-address';
import { addressDetailsMissingRequiredFields } from '@domain/ins/constants/address-details';

test.describe(`Accessibility ${WCAG_STANDARD.name}`, { tag: '@a11y' }, () => {
  test('the add address form has no accessibility violations when errors are shown', async ({ insPages, runA11yScan }) => {
    await insPages.addressBookAdd.open();
    await insPages.addressBookAdd.heading.waitFor();
    await insPages.addressBookAdd.fill(addressDetailsMissingRequiredFields(''));
    await insPages.addressBookAdd.save();
    await expect(insPages.addressBookAdd.errorSummary).toBeVisible();

    await runA11yScan();
  });

  test('the edit address form has no accessibility violations when errors are shown', async ({ insPages, addressBookApi, runA11yScan }) => {
    const created = await addressBookApi.createAddress(traderAddress(`A11y Error Farm ${Date.now()}`));
    await insPages.addressBookEdit.open(created.id);
    await insPages.addressBookEdit.heading.waitFor();
    await insPages.addressBookEdit.fill({ ...addressDetailsMissingRequiredFields(''), country: 'United Kingdom' });
    await insPages.addressBookEdit.save();
    await expect(insPages.addressBookEdit.errorSummary).toBeVisible();

    await runA11yScan();
  });
});
