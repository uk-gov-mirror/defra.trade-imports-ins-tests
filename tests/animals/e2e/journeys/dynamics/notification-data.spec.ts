import { AnimalsDynamicsClient } from '@adapters/http/animals-dynamics-client';
import { formattedValue } from '@adapters/http/dataverse-client';
import { animalsDynamics } from '@config/animals-dynamics';
import { defaultUser } from '@config/users';
import { ALL_ANSWERS, MANDATORY_ANSWERS } from '@domain/animals/constants/journey-options';
import type { AnimalsDynamicsImporterNotification } from '@domain/animals/models/dynamics/importer-notification';
import { test, expect } from '@fixtures';
import { annotateDuration } from '@utils/playwright/annotate-duration';
import { skipIfComposeEnvironment } from '@utils/playwright/environment';

// Answers PIMS Dynamics does not store yet are asserted in notification-data-gaps.spec.ts. Each has a comment in its
// place below, led by its likely cause in square brackets (the causes are defined in that file), so moving its
// assertion here when PIMS stores it keeps the answers in journey order.

// Traces record APIRequestContext calls with their headers and form bodies: the bearer token and client secret.
// Top level because Playwright rejects test.use({ trace }) inside a describe group.
test.use({ trace: 'off' });

/** The journey types the date as d/m/yyyy; PIMS Dynamics returns an ISO date. */
const toIsoDate = (dayMonthYear: string): string => {
  const [day, month, year] = dayMonthYear.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

/** PIMS Dynamics' labels for the countries the parties' address-book records are in. */
const PIMS_COUNTRY_LABELS: Record<string, string> = {
  CH: 'Switzerland',
  GB: 'United Kingdom of Great Britain and Northern Ireland',
  IE: 'Republic of Ireland',
};

/** PIMS Dynamics' text for each means of transport, which is not the journey's label for it. */
const PIMS_MEANS_OF_TRANSPORT_LABELS: Record<string, string> = {
  AIRPLANE: 'Aeroplane',
  RAILWAY: 'Railway Wagon',
  ROAD_VEHICLE: 'Road Vehicle',
  VESSEL: 'Ship',
};

/** The whole row, so a run shows the real lookups, option-set labels, dates and values to assert against. */
const attachRow = (row: AnimalsDynamicsImporterNotification): Promise<void> =>
  test.info().attach('pims-dynamics-row.json', { body: JSON.stringify(row, null, 2), contentType: 'application/json' });

test.describe('PIMS Dynamics notification data', { tag: '@dynamics' }, () => {
  test.beforeEach(() => {
    skipIfComposeEnvironment('the compose stack has no PIMS Dynamics');
    // The slowed UI journey plus the PIMS Dynamics poll.
    test.slow();
    test.setTimeout(test.info().timeout + animalsDynamics.arrivalTimeoutMs);
  });

  test('a notification submitted with only the mandatory answers is stored in PIMS Dynamics', async ({
    animalsJourney,
    journeyContext,
    externalRequest,
    addressBookApi,
  }) => {
    // Built first: a missing ANIMALS_DYNAMICS_URL / DATAVERSE_* secret fails here, before the journey.
    const dynamics = new AnimalsDynamicsClient(externalRequest);
    const answers = MANDATORY_ANSWERS;
    const consignor = await addressBookApi.findByName(answers.parties.consignor);
    const destination = await addressBookApi.findByName(answers.parties.placeOfDestination);
    const placeOfOrigin = await addressBookApi.findByName(answers.parties.placeOfOrigin);
    const consignee = await addressBookApi.findByName(answers.parties.consignee);
    const importer = await addressBookApi.findByName(answers.parties.importer);
    await animalsJourney.submitNotification(answers);
    const referenceNumber = journeyContext.referenceNumber;

    await annotateDuration(animalsDynamics.submissionPollAnnotation, () =>
      expect
        .poll(
          () => dynamics.findNotifications(referenceNumber),
          animalsDynamics.pollOptions(`Expected exactly one notification for ${referenceNumber}`),
        )
        .toHaveLength(1),
    );

    // No columns requested, so the whole row comes back.
    const [row] = await dynamics.findNotifications(referenceNumber);
    await attachRow(row);

    expect.soft(row.defraimp_name, 'reference number').toBe(referenceNumber);
    expect.soft(row.defraimp_submittedbydisplayname, 'submitted by').toBe(defaultUser.displayName);

    // Each mandatory answer, in the order MandatoryAnswers declares them.
    expect.soft(formattedValue(row, '_defraimp_countryoforiginid_value'), 'country of origin').toBe(answers.countryCode.display);
    // answers.requiresRegionCode: not on this row, it is a journey flag.
    // answers.species: [FROM v0.2.0] see 'mandatory answers PIMS Dynamics does not store yet' test (species name and common name).
    // answers.noOfAnimals: [FROM v0.1.0: NOT MAPPED?] see 'mandatory answers PIMS Dynamics does not store yet' test.
    // answers.earTag: [FROM v0.1.0: NOT MAPPED?] see 'mandatory answers PIMS Dynamics does not store yet' test.
    // answers.importReason: [FROM v0.1.0: OPTION NOT MATCHED?] see 'mandatory answers PIMS Dynamics does not store yet' test.
    // answers.internalMarketPurpose: [FROM v0.1.0: NOT IN MESSAGE] see 'mandatory answers PIMS Dynamics does not store yet' test.
    // answers.certifiedFor: [FROM v0.1.0: OPTION NOT MATCHED?] see 'mandatory answers PIMS Dynamics does not store yet' test.
    // answers.unweanedAnimals: PIMS defaults the column to false, so a no answer proves nothing. A yes answer is asserted
    // in 'answering yes to unweaned animals is stored in PIMS Dynamics' (gaps spec).
    expect.soft(row.defraimp_commoditiesincludenonablactedanimals, 'unweaned animals').toBe(false);
    expect.soft(row.defraimp_consignorcompanyname, 'consignor').toBe(answers.parties.consignor);
    expect.soft(row.defraimp_consignoraddressaddressline1, 'consignor address line 1').toBe(consignor.addressLine1);
    expect.soft(row.defraimp_consignoraddresscity, 'consignor city').toBe(consignor.townOrCity);
    expect
      .soft(formattedValue(row, '_defraimp_consignoraddresscountryid_value'), 'consignor country')
      .toBe(PIMS_COUNTRY_LABELS[consignor.countryCode]);
    // consignor.postcode: [FROM v0.2.0] see 'mandatory answers PIMS Dynamics does not store yet' test.
    // consignor.phone: [FROM v0.2.0] see 'mandatory answers PIMS Dynamics does not store yet' test.
    // consignor.email: [FROM v0.2.0] see 'mandatory answers PIMS Dynamics does not store yet' test.
    expect.soft(row.defraimp_placeofdestinationcompanyname, 'place of destination').toBe(answers.parties.placeOfDestination);
    expect.soft(row.defraimp_placeofdestinationaddressaddressline1, 'place of destination address line 1').toBe(destination.addressLine1);
    expect.soft(row.defraimp_placeofdestinationaddresscity, 'place of destination city').toBe(destination.townOrCity);
    expect
      .soft(formattedValue(row, '_defraimp_placeofdestinationcountryid_value'), 'place of destination country')
      .toBe(PIMS_COUNTRY_LABELS[destination.countryCode]);
    // destination.postcode: [FROM v0.2.0] see 'mandatory answers PIMS Dynamics does not store yet' test.
    // destination.phone: [FROM v0.2.0] see 'mandatory answers PIMS Dynamics does not store yet' test.
    // destination.email: [FROM v0.2.0] see 'mandatory answers PIMS Dynamics does not store yet' test.
    expect.soft(row.defraimp_placeoforigincompanyname, 'place of origin').toBe(answers.parties.placeOfOrigin);
    expect.soft(row.defraimp_placeoforiginaddressline1, 'place of origin address line 1').toBe(placeOfOrigin.addressLine1);
    expect.soft(row.defraimp_placeoforigincity, 'place of origin city').toBe(placeOfOrigin.townOrCity);
    expect
      .soft(formattedValue(row, '_defraimp_placeoforigincountryid_value'), 'place of origin country')
      .toBe(PIMS_COUNTRY_LABELS[placeOfOrigin.countryCode]);
    // placeOfOrigin.postcode: [FROM v0.2.0] see 'mandatory answers PIMS Dynamics does not store yet' test.
    // placeOfOrigin.phone: [FROM v0.2.0] see 'mandatory answers PIMS Dynamics does not store yet' test.
    // placeOfOrigin.email: [FROM v0.2.0] see 'mandatory answers PIMS Dynamics does not store yet' test.
    expect.soft(row.defraimp_consigneecompanyname, 'consignee').toBe(answers.parties.consignee);
    expect.soft(row.defraimp_consigneeaddressaddressline1, 'consignee address line 1').toBe(consignee.addressLine1);
    expect.soft(row.defraimp_consigneeaddresscity, 'consignee city').toBe(consignee.townOrCity);
    expect
      .soft(formattedValue(row, '_defraimp_consigneeaddresscountryid_value'), 'consignee country')
      .toBe(PIMS_COUNTRY_LABELS[consignee.countryCode]);
    // consignee.postcode: [FROM v0.2.0] see 'mandatory answers PIMS Dynamics does not store yet' test.
    // consignee.phone: [FROM v0.2.0] see 'mandatory answers PIMS Dynamics does not store yet' test.
    // consignee.email: [FROM v0.2.0] see 'mandatory answers PIMS Dynamics does not store yet' test.
    expect.soft(row.defraimp_importercompanyname, 'importer').toBe(answers.parties.importer);
    expect.soft(row.defraimp_importeraddressaddressline1, 'importer address line 1').toBe(importer.addressLine1);
    expect.soft(row.defraimp_importeraddresscity, 'importer city').toBe(importer.townOrCity);
    expect
      .soft(formattedValue(row, '_defraimp_importeraddresscountryid_value'), 'importer country')
      .toBe(PIMS_COUNTRY_LABELS[importer.countryCode]);
    // importer.postcode: [FROM v0.2.0] see 'mandatory answers PIMS Dynamics does not store yet' test.
    // importer.phone: [FROM v0.2.0] see 'mandatory answers PIMS Dynamics does not store yet' test.
    // importer.email: [FROM v0.2.0] see 'mandatory answers PIMS Dynamics does not store yet' test.
    // answers.cph: [FROM v0.2.0] see 'mandatory answers PIMS Dynamics does not store yet' test.
    expect.soft(row.defraimp_arrivaldate?.slice(0, 10), 'arrival date').toBe(toIsoDate(answers.arrivalDate));
    expect.soft(row.defraimp_portofentry, 'point of entry').toBe(answers.pointOfEntry.value);
    expect
      .soft(row.defraimp_meansoftransporttoentrypointtype, 'means of transport')
      .toBe(PIMS_MEANS_OF_TRANSPORT_LABELS[answers.meansOfTransport.value]);
    // answers.transportIdentification: [FROM v0.1.0: NOT MAPPED?] see 'mandatory answers PIMS Dynamics does not store yet' test.
    // answers.transportDocumentReference: [FROM v0.2.0] see 'mandatory answers PIMS Dynamics does not store yet' test.
    expect.soft(row.defraimp_transportercompanyname, 'transporter').toBe(answers.transporter.display);
    // The rest of the transporter comes from its reference record, not the answers, so only its presence is asserted.
    expect.soft(row.defraimp_transporterapprovalnumber, 'transporter approval number').not.toBeNull();
    expect.soft(row.defraimp_transportertype, 'transporter type').not.toBeNull();
    expect.soft(row.defraimp_transporteraddressaddressline1, 'transporter address line 1').not.toBeNull();
    expect.soft(row.defraimp_transporteraddressaddressline2, 'transporter address line 2').not.toBeNull();
    expect.soft(formattedValue(row, '_defraimp_transporteraddresscountryid_value'), 'transporter country').toBeDefined();
    // answers.contactAddress: [FROM v0.3.0] see 'mandatory answers PIMS Dynamics does not store yet' test.

    // The optional answers left blank, only in columns that neither PIMS nor the gateway can fill in by default.
    expect.soft(row.defraimp_commoditiesregionoforigin, 'region of origin code').toBeNull();
    expect.soft(row.defraimp_traderreference, 'internal reference').toBeNull();
    expect.soft(row.defraimp_commoditiesnumberofpackages, 'number of packages').toBeNull();
    expect.soft(row.defraimp_routetransitingstates, 'transited countries').toBeNull();
  });

  test('a notification submitted with every answer is stored in PIMS Dynamics with its optional answers', async ({
    animalsJourney,
    journeyContext,
    externalRequest,
  }) => {
    // The accompanying document is uploaded and virus-scanned before the journey can submit.
    test.setTimeout(test.info().timeout + 2 * 60_000);
    const dynamics = new AnimalsDynamicsClient(externalRequest);
    const answers = ALL_ANSWERS;
    await animalsJourney.submitNotification(answers);
    const referenceNumber = journeyContext.referenceNumber;

    await annotateDuration(animalsDynamics.submissionPollAnnotation, () =>
      expect
        .poll(
          () => dynamics.findNotifications(referenceNumber),
          animalsDynamics.pollOptions(`Expected exactly one notification for ${referenceNumber}`),
        )
        .toHaveLength(1),
    );

    const [row] = await dynamics.findNotifications(referenceNumber);
    await attachRow(row);

    // Only what ALL_ANSWERS adds to the mandatory answers, which the first test covers, in the order OptionalAnswers
    // declares them, which is the order the journey asks them.
    // answers.requiresRegionCode: not on this row, it is a journey flag.
    // answers.regionCode: [FROM v0.3.0] see 'optional answers PIMS Dynamics does not store yet' test.
    expect.soft(row.defraimp_traderreference, 'internal reference').toBe(answers.internalReference);
    // answers.noOfPackages: [FROM v0.1.0: NOT MAPPED?] see 'optional answers PIMS Dynamics does not store yet' test.
    // answers.passportNumber: [FROM v0.1.0: NOT MAPPED?] see 'optional answers PIMS Dynamics does not store yet' test.
    // answers.transitedCountries: [FROM v0.2.0] see 'optional answers PIMS Dynamics does not store yet' test.
    // answers.accompanyingDocument: [FROM v0.2.0] see 'optional answers PIMS Dynamics does not store yet' test.
  });
});
