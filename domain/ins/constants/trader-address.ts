import { type AddressDetails } from '@page-objects/ins/address-book/form-page';

export const UNOFFERED_COUNTRY_CODE = 'XX';

export const traderAddress = (name: string) => ({
  name,
  addressLine1: '1 Trader Lane',
  townOrCity: 'Carlisle',
  postcode: 'CA1 3CC',
  countryCode: 'GB',
  phone: '01228 555 0105',
  email: 'trader@example.co.uk',
});

export const traderAddressInUnofferedCountry = (name: string) => ({
  ...traderAddress(name),
  countryCode: UNOFFERED_COUNTRY_CODE,
});

export const addressWithLineTwoAndCounty = (name: string, { addressLine2 = 'Unit 9', county = 'Cumbria' } = {}) => ({
  ...traderAddress(name),
  addressLine2,
  county,
});

export const addFormAddressWithLineTwoAndCounty = (name: string, country: string): AddressDetails => {
  const { addressLine1, addressLine2, townOrCity, county, postcode, email, phone } = addressWithLineTwoAndCounty(name);
  return { name, addressLine1, addressLine2, townOrCity, county, postcode, country, email, phone };
};
