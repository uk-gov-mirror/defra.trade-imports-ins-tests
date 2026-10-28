import { type CountryCode, countryCodes } from '@domain/animals/constants/country-codes';
import { type CertificationPurpose, certificationPurposes } from '@domain/animals/constants/certification-purposes';
import { type CommodityLine, commodityLines } from '@domain/animals/constants/commodity-lines';
import { documentTypes } from '@domain/animals/constants/document-types';
import { type ImportReason, importReasons } from '@domain/animals/constants/import-reasons';
import { type InternalMarketPurpose, internalMarketPurposes } from '@domain/animals/constants/internal-market-purposes';
import { type MeansOfTransport, meansOfTransport } from '@domain/animals/constants/means-of-transport';
import { type Transporter, transporters } from '@domain/animals/constants/transporters';
import { type PointOfEntry, pointOfEntries } from '@domain/animals/constants/point-of-entries';
import { type YesNoValue, yesNoValues } from '@domain/shared/constants/yes-no-values';
import { fileUploadPaths } from '@resources/file-upload/paths';
import { getRelativeAppDateText } from '@utils/date-utils';

export const PLACE_OF_ORIGIN_NAME = 'Origin Farm';
export const CONSIGNOR_NAME = 'Astra Rosales';
export const CONSIGNEE_NAME = 'British Livestock Ltd';
export const IMPORTER_NAME = 'Import Co UK';
export const DESTINATION_NAME = 'Tech Imports Ltd';
export const CONTACT_ADDRESS_NAME = 'Animal and Plant Health Agency';

// Inside the arrival-date window (1 week back to 6 months ahead) wherever the
// wall clock happens to be, in the unpadded d/m/yyyy the app itself renders —
// so a CYA assertion compares against the app's shape, not the typed string it
// happens to echo back.
export const ARRIVAL_DATE = getRelativeAppDateText({ monthOffset: 1 });

export type CphAnswer = { county: string; parish: string; holding: string };

const CPH: CphAnswer = { county: '12', parish: '345', holding: '6789' };
export const CPH_NUMBER = `${CPH.county}${CPH.parish}${CPH.holding}`;

export type AccompanyingDocumentAnswer = {
  reference: string;
  /** As typed into the date field, d/m/yyyy. */
  issueDate: string;
  filePath: string;
  /** The document-type code the select submits, e.g. VETERINARY_HEALTH_CERTIFICATE. */
  type: string;
};

export type PartyAnswers = {
  consignor: string;
  placeOfDestination: string;
  placeOfOrigin: string;
  consignee: string;
  importer: string;
};

/**
 * What a user says about a cattle notification, never how a driver enters it: the UI journey and
 * the seeded journey both build from these, each translating a fact into its own page or form.
 * Only the answers the frontend requires, so a missing one is a compile error.
 */
export type MandatoryAnswers = {
  countryCode: CountryCode;
  requiresRegionCode: YesNoValue;
  commodityLines: CommodityLineAnswer[];
  importReason: ImportReason;
  internalMarketPurpose: InternalMarketPurpose;
  certifiedFor: CertificationPurpose;
  unweanedAnimals: YesNoValue;
  parties: PartyAnswers;
  cph: CphAnswer;
  arrivalDate: string;
  pointOfEntry: PointOfEntry;
  meansOfTransport: MeansOfTransport;
  transportIdentification: string;
  transportDocumentReference: string;
  transporter: Transporter;
  contactAddress: string;
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

/** One commodity line on the notification — species, counts and the identifiers that species needs. */
export type CommodityLineAnswer = {
  species: CommodityLine;
  noOfAnimals: number;
  noOfPackages?: number;
  earTag?: string;
  passportNumber?: string;
  microchip?: string;
  permanentAddress?: PermanentAddressAnswer;
};

/** The answers the frontend leaves optional for cattle. */
export type OptionalAnswers = {
  /** Asked when the origin needs a region code. */
  regionCode: string;
  internalReference: string;
  /** Asked only of rail and road consignments. */
  transitedCountries: CountryCode[];
  accompanyingDocument: AccompanyingDocumentAnswer;
};

export type NotificationAnswers = MandatoryAnswers & Partial<OptionalAnswers>;

export type AllAnswers = MandatoryAnswers & OptionalAnswers;

export type AllAnswersWithoutDocument = MandatoryAnswers &
  Omit<OptionalAnswers, 'accompanyingDocument'> & { accompanyingDocument?: undefined };

/** The origin page's fields, for callers that answer only that page. */
export type OriginOptions = Partial<Pick<NotificationAnswers, 'countryCode' | 'requiresRegionCode' | 'regionCode' | 'internalReference'>>;

/** Throws when the answers contradict each other: a region code is given exactly when the origin requires one. */
export const assertConsistentAnswers = (answers: NotificationAnswers): void => {
  const requiresRegionCode = answers.requiresRegionCode === yesNoValues.yes;
  if (requiresRegionCode && !answers.regionCode) {
    throw new Error('The answers require a region of origin code but give none.');
  }
  if (!requiresRegionCode && answers.regionCode) {
    throw new Error(`The answers give the region of origin code "${answers.regionCode}" but do not require one.`);
  }
};

const mandatoryCowLine: CommodityLineAnswer = {
  species: commodityLines.cattle,
  noOfAnimals: 1,
  earTag: 'UK123456789012',
};

const allAnswersCowLine: CommodityLineAnswer = {
  ...mandatoryCowLine,
  noOfPackages: 5,
  passportNumber: 'PASSPORT-0001',
};

export const catLine: CommodityLineAnswer = {
  species: commodityLines.domesticCat,
  noOfAnimals: 1,
  passportNumber: 'UK-CAT-1',
  microchip: '900987654321098',
  permanentAddress: {
    nameOrOrganisationName: 'Pet Owner',
    addressLine1: '1 Farm Lane',
    townOrCity: 'Skipton',
    postcode: 'BD23 1UD',
    phone: '+44 1756 555 0192',
    email: 'owner@example.co.uk',
  },
};

export const MANDATORY_ANSWERS: MandatoryAnswers = {
  countryCode: countryCodes.eu.france,
  requiresRegionCode: yesNoValues.no,
  commodityLines: [mandatoryCowLine],
  importReason: importReasons.internalMarket,
  internalMarketPurpose: internalMarketPurposes.breeding,
  certifiedFor: certificationPurposes.slaughter,
  unweanedAnimals: yesNoValues.no,
  parties: {
    consignor: CONSIGNOR_NAME,
    placeOfDestination: DESTINATION_NAME,
    placeOfOrigin: PLACE_OF_ORIGIN_NAME,
    consignee: CONSIGNEE_NAME,
    importer: IMPORTER_NAME,
  },
  cph: CPH,
  arrivalDate: ARRIVAL_DATE,
  pointOfEntry: pointOfEntries.aberdeenHarbour,
  meansOfTransport: meansOfTransport.roadVehicle,
  transportIdentification: 'FR-892-LK',
  transportDocumentReference: 'CMR-2026-884721',
  transporter: transporters.garciaLivestockTransport,
  contactAddress: CONTACT_ADDRESS_NAME,
};

/** Every answer, including an accompanying document. The UI journey uses this set, as a browser can upload a file. */
export const ALL_ANSWERS: AllAnswers = {
  ...MANDATORY_ANSWERS,
  commodityLines: [allAnswersCowLine],
  requiresRegionCode: yesNoValues.yes,
  regionCode: '75',
  internalReference: 'Imports456GB',
  transitedCountries: [countryCodes.eu.france, countryCodes.eu.belgium],
  accompanyingDocument: {
    reference: 'DOCREF0001',
    issueDate: '03/01/2026',
    filePath: fileUploadPaths.safeFile1kbPdf,
    type: documentTypes.veterinaryHealthCertificate,
  },
};

/** Every answer except the accompanying document. The seeded journey uses this set, as its form client cannot upload a file. */
export const ALL_ANSWERS_WITHOUT_DOCUMENT: AllAnswersWithoutDocument = {
  ...ALL_ANSWERS,
  accompanyingDocument: undefined,
};
