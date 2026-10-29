import { commoditySpecies, type CommoditySpecies } from '@domain/animals/constants/commodity-species';

/** One commodity line on the notification — species, counts and the identifiers that species needs. */
export type CommodityLineAnswer = {
  species: CommoditySpecies;
  noOfAnimals: number;
  noOfPackages?: number;
  earTag?: string;
  passportNumber?: string;
  microchip?: string;
  tattoo?: string;
  permanentAddress?: PermanentAddressAnswer;
};

export type PermanentAddressAnswer = {
  nameOrOrganisationName: string;
  addressLine1: string;
  townOrCity: string;
  postcode: string;
  phone: string;
  email: string;
  addressLine2?: string;
  county?: string;
};

/** One animal per line, answering only what the frontend requires of that species. */
export const MANDATORY_COMMODITY_LINES = {
  cattle: {
    species: commoditySpecies.cattle,
    noOfAnimals: 1,
    earTag: 'UK123456789012',
  },
  domesticCat: {
    species: commoditySpecies.domesticCat,
    noOfAnimals: 1,
    passportNumber: 'UK123456789',
    permanentAddress: {
      nameOrOrganisationName: 'Pet Owner',
      addressLine1: '1 Farm Lane',
      townOrCity: 'Skipton',
      postcode: 'BD23 1UD',
      phone: '+44 1756 555 0192',
      email: 'owner@example.co.uk',
    },
  },
} satisfies Record<string, CommodityLineAnswer>;

/** One animal per line, answering every field the frontend offers that species. */
export const ALL_COMMODITY_LINES = {
  cattle: {
    ...MANDATORY_COMMODITY_LINES.cattle,
    noOfPackages: 5,
    passportNumber: 'PASSPORT-0001',
  },
  domesticCat: {
    ...MANDATORY_COMMODITY_LINES.domesticCat,
    noOfPackages: 1,
    microchip: '900987654321098',
    tattoo: 'AB1234',
    permanentAddress: {
      ...MANDATORY_COMMODITY_LINES.domesticCat.permanentAddress,
      addressLine2: 'Low Moor',
      county: 'North Yorkshire',
    },
  },
} satisfies Record<string, CommodityLineAnswer>;
