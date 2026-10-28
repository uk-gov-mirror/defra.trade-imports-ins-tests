import type { ObjectId } from 'mongodb';

type StoredAddress = {
  addressLine1: string;
  addressLine2?: string;
  townOrCity: string;
  county?: string;
  postcode: string;
  countryCode: string;
};

/**
 * A copy of the address-book record picked for the role, with no link back to
 * it. An unanswered role has none of these fields, so every field is optional.
 */
type StoredParty = {
  name?: string;
  email?: string;
  phone?: string;
  address?: StoredAddress;
};

/**
 * One animal-identifier unit on a species line — every unit, not just the
 * first.
 */
type StoredAnimalIdentifier = {
  microchip?: string;
  passport?: string;
  tattoo?: string;
  earTag?: string;
  horseName?: string;
  permanentAddress?: StoredParty;
};

type StoredSpecies = {
  value: string;
  text: string;
  commonName?: string;
  typeOfCommodity?: string;
  noOfAnimals: number;
  noOfPackages: number;
  earTag?: string;
  passport?: string;
  microchip?: string;
  animalIdentifiers?: StoredAnimalIdentifier[];
};

type StoredCommodityComplement = {
  name: string;
  commodityCode?: string;
  description?: string;
  typeOfCommodity?: string;
  totalNoOfAnimals: number;
  totalNoOfPackages?: number;
  species: StoredSpecies[];
};

type NotificationContent = {
  origin: {
    countryCode: string;
    requiresRegionCode: string;
    regionOfOriginCode?: string;
    internalReference?: string;
  };
  commodities: StoredCommodityComplement[];
  reasonForImport: string;
  additionalDetails: {
    certifiedFor?: string;
    unweanedAnimals: string;
  };
  placeOfOrigin?: StoredParty;
  consignor?: StoredParty;
  consignee?: StoredParty;
  importer?: StoredParty;
  destination?: StoredParty;
  cphNumber?: string;
  transport: {
    portOfEntry?: string;
    /** A calendar date, stored as a `YYYY-MM-DD` string. */
    arrivalDate?: string;
    meansOfTransport: string;
    transportIdentification?: string;
    transportDocumentReference?: string;
    transitedCountries?: string[];
    transporter?: {
      name: string;
      address: Partial<StoredAddress>;
      approvalNumber: string;
      type: string;
    };
  };
  consignment?: StoredParty;
  purposeInInternalMarket?: string;
  destinationCountry?: string;
  portOfExit?: string;
  /** A calendar date, stored as a `YYYY-MM-DD` string. */
  exitDate?: string;
};

export type NotificationDocument = {
  _id: ObjectId;
  referenceNumber: string | null;
  notification: NotificationContent;
  fulfilments?: unknown[];
  /** Pre-amend snapshot of notification content. Present only during an in-flight amendment. */
  preAmendNotification?: NotificationContent;
  status: string;
  created: Date;
  updated: Date;
  _class: string;
};
