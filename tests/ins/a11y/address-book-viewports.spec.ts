import { test, expect, WCAG_STANDARD, scanViewports } from '@fixtures/a11y';
import { scanNarrowPage } from '@utils/narrow-page-scan';
import { traderAddress } from '@domain/ins/constants/trader-address';
import { addressDetailsMissingRequiredFields } from '@domain/ins/constants/address-details';

const narrowViewports = {
  'narrow portrait': scanViewports.narrowPortrait,
  'narrow landscape': scanViewports.narrowLandscape,
};

for (const [viewportName, viewport] of Object.entries(narrowViewports)) {
  test.describe(`Accessibility ${WCAG_STANDARD.name}`, { tag: '@a11y' }, () => {
    test.use({ viewport });

    test(`the address book pages have no accessibility violations and no sideways scrolling at ${viewportName}`, async ({
      page,
      insPages,
      addressBookApi,
      runA11yScan,
    }) => {
      const created = await addressBookApi.createAddress(traderAddress(`A11y Narrow Farm ${Date.now()}`));

      await test.step('Address book (populated list)', async () => {
        await insPages.addressBookList.open();
        await insPages.addressBookList.heading.waitFor();
        await scanNarrowPage(page, runA11yScan);
      });

      await test.step('Add address (blank)', async () => {
        await insPages.addressBookAdd.open();
        await insPages.addressBookAdd.heading.waitFor();
        await scanNarrowPage(page, runA11yScan);
      });

      await test.step('Add address with validation errors', async () => {
        await insPages.addressBookAdd.fill(addressDetailsMissingRequiredFields(''));
        await insPages.addressBookAdd.save();
        await expect(insPages.addressBookAdd.errorSummary).toBeVisible();
        await scanNarrowPage(page, runA11yScan);
      });

      await test.step('Edit address, filled with the stored address', async () => {
        await insPages.addressBookEdit.open(created.id);
        await insPages.addressBookEdit.heading.waitFor();
        await scanNarrowPage(page, runA11yScan);
      });
    });
  });
}
