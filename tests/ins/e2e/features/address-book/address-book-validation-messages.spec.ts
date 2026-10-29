import { test, expect } from '@fixtures';
import { RestClientError } from '@adapters/http/rest-client';
import type { InsAddressBookFormPage } from '@page-objects/ins/address-book/form-page';
import { traderAddressInUnofferedCountry } from '@domain/ins/constants/trader-address';

const MESSAGES = {
  name: 'Enter a name or organisation',
  postcode: 'Enter a postcode or Zip code',
  country: 'Select a country',
  phone: 'Enter a phone number',
};

const baseAddress = {
  addressLine1: '1 Message Lane',
  townOrCity: 'Carlisle',
  postcode: 'CA1 5EE',
  countryCode: 'GB',
  phone: '01228 555 0111',
  email: 'messages@example.co.uk',
};

interface ValidationProblem {
  type: string;
  errors: Record<string, string[]>;
}

const expectedApiRefusalOf = (caught: unknown): { status: number; body: ValidationProblem } => {
  expect(caught).toBeInstanceOf(RestClientError);
  const error = caught as RestClientError;
  return { status: error.status, body: JSON.parse(error.responseBody) as ValidationProblem };
};

const expectFourMessagesAtTopAndAgainstFields = async (form: InsAddressBookFormPage): Promise<void> => {
  await expect(form.errorSummary).toBeVisible();
  await expect(form.errorSummaryLink(MESSAGES.name)).toBeVisible();
  await expect(form.errorSummaryLink(MESSAGES.postcode)).toBeVisible();
  await expect(form.errorSummaryLink(MESSAGES.country)).toBeVisible();
  await expect(form.errorSummaryLink(MESSAGES.phone)).toBeVisible();
  await expect(form.inputName).toHaveAccessibleDescription(new RegExp(MESSAGES.name));
  await expect(form.inputPostcode).toHaveAccessibleDescription(new RegExp(MESSAGES.postcode));
  await expect(form.selectCountry).toHaveAccessibleDescription(new RegExp(MESSAGES.country));
  await expect(form.inputPhone).toHaveAccessibleDescription(new RegExp(MESSAGES.phone));
};

test.describe('Address book validation messages', () => {
  test('saving the add form with name, postcode, country and phone left blank shows each message at the top and against its field', async ({
    insPages,
  }) => {
    await insPages.addressBookAdd.open();
    await insPages.addressBookAdd.fill({
      name: '',
      addressLine1: baseAddress.addressLine1,
      townOrCity: baseAddress.townOrCity,
      postcode: '',
      country: '',
      email: baseAddress.email,
      phone: '',
    });
    await insPages.addressBookAdd.save();

    await expect(insPages.addressBookAdd.heading).toBeVisible();
    await expectFourMessagesAtTopAndAgainstFields(insPages.addressBookAdd);
  });

  test('saving the edit form of an address whose stored country is not offered, with name, postcode and phone cleared and no country chosen, shows the four messages and saves nothing', async ({
    insPages,
    addressBookApi,
  }) => {
    const address = traderAddressInUnofferedCountry(`Message Farm ${Date.now()}`);
    const created = await addressBookApi.createAddress(address);

    await insPages.addressBookEdit.open(created.id);
    await insPages.addressBookEdit.fill({
      name: '',
      addressLine1: address.addressLine1,
      townOrCity: address.townOrCity,
      postcode: '',
      country: '',
      email: address.email,
      phone: '',
    });
    await insPages.addressBookEdit.save();

    await expect(insPages.addressBookEdit.heading).toBeVisible();
    await expectFourMessagesAtTopAndAgainstFields(insPages.addressBookEdit);
    expect(await addressBookApi.getAddress(created.id)).toMatchObject(address);
  });

  test('the address book API refuses a blank name, postcode, country and phone with the same messages, keyed by field', async ({
    addressBookApi,
  }) => {
    const searchMarkerTown = `Refused Town ${Date.now()}`;
    const caught = await addressBookApi
      .createAddress({ ...baseAddress, townOrCity: searchMarkerTown, name: '', postcode: '', countryCode: '', phone: '' })
      .catch((error: unknown) => error);

    const { status, body } = expectedApiRefusalOf(caught);
    expect(status).toBe(400);
    expect(body.type).toBe('https://api.cdp.defra.cloud/problems/validation-error');
    expect(body.errors.name).toContain(MESSAGES.name);
    expect(body.errors.postcode).toContain(MESSAGES.postcode);
    expect(body.errors.countryCode).toContain(MESSAGES.country);
    expect(body.errors.phone).toContain(MESSAGES.phone);
    expect(await addressBookApi.listAddresses(searchMarkerTown)).toHaveLength(0);
  });
});
