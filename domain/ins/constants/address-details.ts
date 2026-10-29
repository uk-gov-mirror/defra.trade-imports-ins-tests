import type { AddressDetails } from '@page-objects/ins/address-book/form-page';
import { addFormAddressWithLineTwoAndCounty } from '@domain/ins/constants/trader-address';

export const addressDetailsMissingRequiredFields = (name: string): AddressDetails => ({
  ...addFormAddressWithLineTwoAndCounty(name, ''),
  name: '',
  postcode: '',
  phone: '',
});
