import { Locator } from '@playwright/test';
import { test, expect } from '@fixtures';
import { InsAddressBookFormPage } from '@page-objects/ins/address-book/form-page';
import { addressWithLineTwoAndCounty } from '@domain/ins/constants/trader-address';

const FIELD_NAMES_IN_ORDER = [
  'Name or organisation',
  'Address line 1',
  'Address line 2 (optional)',
  'Town or city',
  'County (optional)',
  'Postcode or Zip code',
];

async function expectAbove(upper: Locator, lower: Locator): Promise<void> {
  const upperBox = await upper.boundingBox();
  const lowerBox = await lower.boundingBox();
  expect(upperBox).not.toBeNull();
  expect(lowerBox).not.toBeNull();
  expect(upperBox.y).toBeLessThan(lowerBox.y);
}

async function expectFieldsGroupedUnderSections(form: InsAddressBookFormPage): Promise<void> {
  await expect(form.sectionHeading('Address')).toBeVisible();
  await expect(form.sectionHeading('Contact details')).toBeVisible();
  await expectAbove(form.sectionHeading('Address'), form.inputName);
  await expectAbove(form.selectCountry, form.sectionHeading('Contact details'));
  await expectAbove(form.sectionHeading('Contact details'), form.inputEmail);
  await expectAbove(form.sectionHeading('Contact details'), form.inputPhone);
}

test.describe('The add-details form for an address entered by hand', () => {
  test('the add-details step groups its fields under Address and Contact details, with Name or organisation first and County between Town or city and Postcode, and the edit page labels the name the same', async ({
    insPages,
    addressBookApi,
  }) => {
    await insPages.addressBookAdd.open();

    await expectFieldsGroupedUnderSections(insPages.addressBookAdd);
    for (const [index, name] of FIELD_NAMES_IN_ORDER.entries()) {
      await expect(insPages.addressBookAdd.textboxes.nth(index)).toHaveAccessibleName(name);
    }

    const created = await addressBookApi.createAddress(addressWithLineTwoAndCounty(`Form Label Farm ${Date.now()}`));
    await insPages.addressBookEdit.open(created.id);

    await expect(insPages.addressBookEdit.inputName).toHaveAccessibleName('Name or organisation');
  });

  test('the Country select opens on its blank first option, Select a country, with nothing pre-selected', async ({ insPages }) => {
    await insPages.addressBookAdd.open();

    await expect(insPages.addressBookAdd.selectCountry).toHaveValue('');
    await expect(insPages.addressBookAdd.countryOptionsIncludingPlaceholder.first()).toHaveText('Select a country');
  });

  test('Add a new address on the address book opens the add-details form, whose Back link returns to the address book', async ({
    pages,
    insPages,
  }) => {
    await insPages.addressBookList.open();
    await insPages.addressBookList.btnAddNewAddress.click();

    await expect(pages.page).toHaveURL(new RegExp(`${insPages.addressBookAdd.expectedUrl}$`));
    await expect(insPages.addressBookAdd.heading).toBeVisible();

    await insPages.addressBookAdd.linkBack.click();

    await expect(pages.page).toHaveURL(new RegExp(`${insPages.addressBookList.expectedUrl}$`));
    await expect(insPages.addressBookList.heading).toBeVisible();
  });

  test('Cancel and return to address book is a link below Save and continue that returns to the address book and saves nothing', async ({
    pages,
    insPages,
    addressBookApi,
  }) => {
    const name = `Cancelled Farm ${Date.now()}`;
    await insPages.addressBookAdd.open();
    await insPages.addressBookAdd.inputName.fill(name);
    await expect(insPages.addressBookAdd.btnCancel).toHaveCount(0);

    const buttonBox = await insPages.addressBookAdd.btnSaveAndContinue.boundingBox();
    const linkBox = await insPages.addressBookAdd.linkCancel.boundingBox();
    expect(buttonBox).not.toBeNull();
    expect(linkBox).not.toBeNull();
    expect(linkBox.y).toBeGreaterThan(buttonBox.y);

    await insPages.addressBookAdd.linkCancel.click();

    await expect(pages.page).toHaveURL(new RegExp(`${insPages.addressBookList.expectedUrl}$`));
    await expect(insPages.addressBookList.heading).toBeVisible();
    await expect(insPages.addressBookList.row(name)).toHaveCount(0);
    expect(await addressBookApi.listAddresses(name)).toHaveLength(0);
  });

  test('the edit page groups its fields under Address and Contact details and opens with the saved name', async ({
    insPages,
    addressBookApi,
  }) => {
    const name = `Form Edit Farm ${Date.now()}`;
    const created = await addressBookApi.createAddress(addressWithLineTwoAndCounty(name));

    await insPages.addressBookEdit.open(created.id);

    await expectFieldsGroupedUnderSections(insPages.addressBookEdit);
    await expect(insPages.addressBookEdit.inputName).toHaveValue(name);
  });
});
