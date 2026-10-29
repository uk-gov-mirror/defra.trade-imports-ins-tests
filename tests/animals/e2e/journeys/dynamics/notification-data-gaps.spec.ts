import { AnimalsDynamicsClient } from '@adapters/http/animals-dynamics-client';
import { formattedValue } from '@adapters/http/dataverse-client';
import { animalsDynamics } from '@config/animals-dynamics';
import { GBN_AG_CATTLE_COMMON_NAME } from '@domain/animals/constants/gbn-ag';
import { ALL_ANSWERS, CPH_NUMBER, MANDATORY_ANSWERS } from '@domain/animals/constants/journey-options';
import { yesNoValues } from '@domain/shared/constants/yes-no-values';
import { test, expect } from '@fixtures';
import { annotateDuration } from '@utils/playwright/annotate-duration';
import { skipIfComposeEnvironment } from '@utils/playwright/environment';

// This is a temporary spec file. It holds the end-to-end checks that cannot pass yet, and it is deleted once every
// assertion has moved to notification-data.spec.ts.
//
// Assertions notification-data.spec.ts cannot make yet, because PIMS Dynamics leaves their columns empty: one skipped
// test each for the mandatory answers, the optional answers and a yes to unweaned animals. Assertions are grouped by
// cause (legend order below), then in journey order. When a column fills, move its assertion to its placeholder in
// notification-data.spec.ts, and delete the skip once the test is empty. Expected texts for fixed-list choices are the
// journey's display text until the values PIMS accepts are agreed.
//
// Each group of assertions is headed by the likely cause of its gap. Each assertion has the GBN-AG path it comes from
// above it. An answer travels like this, and can be lost at any step:
//
//   animals backend --> outbox event --> SQS --> gateway --> v0.1.0 message --> PIMS (live in the TST environment today)
//                       (GBN-AG shape)                  \--> v0.2.0 message --> PIMS
//                                                       \--> v0.3.0 message --> PIMS (planned, not emitted yet)
//
// The words used below:
//   event       the backend's record of the submission (owned by the animals backend)
//   message     what the gateway builds from the event and sends to PIMS: v0.1.0, v0.2.0 or v0.3.0 (owned by the gateway)
//   key         the text saved for a choice, passed from the frontend through the event into the message
//               (e.g. internalMarket)
//   column      a field on the PIMS record (owned by PIMS)
//   option set  a column's own fixed choices in PIMS, each with a number and a label (owned by PIMS)
//
// PIMS reads v0.1.0 in the TST environment today (highly likely, not yet confirmed). Each message version carries every
// answer of the one before it, so an answer tagged FROM v0.1.0 is still carried after PIMS moves to v0.2.0. The tags are
// a ladder of what has to happen before PIMS can fill the column:
//
//   [NOT IN SCHEMA]                     no message version defines it, planned or published
//   [FROM v0.3.0]                       first carried by the v0.3.0 message, which is planned and not published yet
//   [FROM v0.2.0]                       first carried by the v0.2.0 message; PIMS has to start reading it
//   [FROM v0.1.0: NOT IN MESSAGE]       the v0.1.0 schema allows it, but the event or the message lacks it (the backend
//                                       or gateway owns the fix, as noted per answer; no new schema version needed)
//   [FROM v0.1.0: OPTION NOT MATCHED?]  a choice from a fixed list (e.g. reason for import): the message carries our
//                                       key, but the column's option set may have no entry for it (the planned v0.3.0
//                                       value lists are meant to settle the keys we send)
//   [FROM v0.1.0: NOT MAPPED?]          typed text or a number (e.g. number of animals): the message carries it, but the
//                                       column is empty, so PIMS may not map it or may store it somewhere else

// Traces record APIRequestContext calls with their headers and form bodies: the bearer token and client secret.
// Top level because Playwright rejects test.use({ trace }) inside a describe group.
test.use({ trace: 'off' });

test.describe('PIMS Dynamics notification data not stored yet', { tag: '@dynamics' }, () => {
  test.beforeEach(() => {
    skipIfComposeEnvironment('the compose stack has no PIMS Dynamics');
    // The slowed UI journey plus the PIMS Dynamics poll.
    test.slow();
    test.setTimeout(test.info().timeout + animalsDynamics.arrivalTimeoutMs);
  });

  test('mandatory answers PIMS Dynamics does not store yet', async ({
    animalsJourney,
    journeyContext,
    externalRequest,
    addressBookApi,
  }) => {
    test.fixme(true, 'PIMS Dynamics leaves these mandatory answers empty; the likely cause of each is in the comments');
    const dynamics = new AnimalsDynamicsClient(externalRequest);
    const answers = MANDATORY_ANSWERS;
    const [cowLine] = answers.commodityLines;
    const consignor = await addressBookApi.findByName(answers.parties.consignor);
    const destination = await addressBookApi.findByName(answers.parties.placeOfDestination);
    const placeOfOrigin = await addressBookApi.findByName(answers.parties.placeOfOrigin);
    const consignee = await addressBookApi.findByName(answers.parties.consignee);
    const importer = await addressBookApi.findByName(answers.parties.importer);
    const contact = await addressBookApi.findByName(answers.contactAddress);
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

    // [NOT IN SCHEMA]
    // None yet.

    // [FROM v0.3.0]
    // exchangedDocument.issuer.postalAddress, a slot shared with the Responsible Person for Load, which PIMS stores in its
    // person-responsible columns (the column asserted is a guess). The backend sends a null issuer and neither published
    // schema defines it; the planned v0.3.0 message is meant to carry it.
    for (const part of [contact.addressLine1, contact.townOrCity, contact.postcode]) {
      expect.soft(row.defraimp_personresponsibleaddress, `contact address ${part}`).toContain(part);
    }

    // [FROM v0.2.0]
    // specifiedConsignment.includedConsignmentItem[].includedTradeLineItem[].scientificName and commonName.
    // The event carries both. Only the v0.2.0 message does; the gateway's v0.1.0 mapper omits the species names.
    expect.soft(row.defraimp_commodityspeciesname, 'species name').toBe(cowLine.species.latinName);
    expect.soft(row.defraimp_commodityspeciescommonname, 'species common name').toBe(GBN_AG_CATTLE_COMMON_NAME);
    // Each party's postalAddress.postcodeCode, and its definedContact[].telephoneUniversalCommunication and
    // emailURIUniversalCommunication.
    // The event carries them. Only the v0.2.0 message does. The phone column is a guess: the row also has an international
    // phone code and number, and a UK telephone.
    expect.soft(row.defraimp_consignoraddresspostalzipcode, 'consignor postcode').toBe(consignor.postcode);
    expect.soft(row.defraimp_consignoraddresstelephone, 'consignor phone').toBe(consignor.phone);
    expect.soft(row.defraimp_consignoraddressemail, 'consignor email').toBe(consignor.email);
    expect.soft(row.defraimp_placeofdestinationaddresspostalzipcode, 'place of destination postcode').toBe(destination.postcode);
    expect.soft(row.defraimp_placeofdestinationaddresstelephone, 'place of destination phone').toBe(destination.phone);
    expect.soft(row.defraimp_placeofdestinationaddressemail, 'place of destination email').toBe(destination.email);
    expect.soft(row.defraimp_placeoforiginpostcode, 'place of origin postcode').toBe(placeOfOrigin.postcode);
    expect.soft(row.defraimp_placeoforiginphone, 'place of origin phone').toBe(placeOfOrigin.phone);
    expect.soft(row.defraimp_placeoforiginemail, 'place of origin email').toBe(placeOfOrigin.email);
    expect.soft(row.defraimp_consigneeaddresspostalzipcode, 'consignee postcode').toBe(consignee.postcode);
    expect.soft(row.defraimp_consigneeaddresstelephone, 'consignee phone').toBe(consignee.phone);
    expect.soft(row.defraimp_consigneeaddressemail, 'consignee email').toBe(consignee.email);
    expect.soft(row.defraimp_importeraddresspostalzipcode, 'importer postcode').toBe(importer.postcode);
    expect.soft(row.defraimp_importeraddresstelephone, 'importer phone').toBe(importer.phone);
    expect.soft(row.defraimp_importeraddressemail, 'importer email').toBe(importer.email);
    // specifiedConsignment.finalDestinationLocation.identifier, the CPH number.
    // The event carries it. Only the v0.2.0 message does; the gateway's v0.1.0 mapper copies only the port of entry location.
    expect.soft(row.defraimp_cphnumber, 'CPH number').toBe(CPH_NUMBER);
    // specifiedConsignment.mainCarriageLogisticsTransportMovement[].transportContractRelatedReferencedDocument[], the transport document.
    // The event carries it. Only the v0.2.0 message does; the gateway's v0.1.0 mapper omits the movement's documents.
    expect.soft(row.defraimp_meansoftransporttoentrypointdocument, 'transport document reference').toBe(answers.transportDocumentReference);

    // [FROM v0.1.0: NOT IN MESSAGE]
    // exchangedDocument.firstSignatoryAuthentication.includedClause[] where identifier is INTERNAL_MARKET_PURPOSE.
    // The backend never puts this clause in the event (it compares the reason against the wrong key and leaves the content
    // null), though both published schemas allow it. A backend fix is enough.
    expect
      .soft(formattedValue(row, 'defraimp_commoditiesinternalmarketpurpose'), 'internal market purpose')
      .toBe(answers.internalMarketPurpose.display);

    // [FROM v0.1.0: OPTION NOT MATCHED?]
    // The same clauses where identifier is PURPOSE, the reason for import.
    // The event carries the frontend's key (e.g. internalMarket) and both messages pass it on, but the column stays empty,
    // so its option set may have no entry for the key. The planned v0.3.0 value lists are meant to settle the keys.
    expect.soft(formattedValue(row, 'defraimp_purposeofconsignment'), 'reason for import').toBe(answers.importReason.display);
    // The same clauses where identifier is GOODS_CERTIFIED_AS, certified for.
    // As above, with the key (e.g. slaughter); defraimp_commoditiesanimalscertifiedas is empty too.
    expect.soft(formattedValue(row, 'defraimp_commoditiescertifiedfor'), 'certified for').toBe(answers.certifiedFor.display);

    // [FROM v0.1.0: NOT MAPPED?]
    // specifiedConsignment.includedConsignmentItem[].includedTradeLineItem[].specifiedLineTradeDelivery[].productUnitQuantity.content,
    // the number of animals.
    // The event carries it and both messages pass it on, but the column is empty. PIMS may not map it, or may store it
    // per species elsewhere. Ask the PIMS team.
    expect.soft(row.defraimp_commoditiesnumberofanimals, 'number of animals').toBe(cowLine.noOfAnimals);
    // specifiedConsignment.includedConsignmentItem[].includedTradeLineItem[].individualTradeProductInstance[].identifier[]
    // where typeCode is EAR_TAG, the ear tag.
    // The event carries it and both messages pass it on, but the identification text column is empty. PIMS has a
    // per-animal identifier table this test does not query, so the ear tag may be there. Ask the PIMS team.
    expect.soft(row.defraimp_identificationofanimalstext, 'ear tag').toContain(cowLine.earTag);
    // specifiedConsignment.mainCarriageLogisticsTransportMovement[].usedLogisticsTransportMeans.name, the transport
    // identification (the movement's own identifier is null in the event).
    // Both messages pass the name on, but the column is empty. Ask the PIMS team; the v0.1.0 schema says the
    // identification will move to the movement's identifier later.
    expect.soft(row.defraimp_meansoftransporttoentrypointid, 'transport identification').toBe(answers.transportIdentification);
  });

  test('optional answers PIMS Dynamics does not store yet', async ({ animalsJourney, journeyContext, externalRequest }) => {
    test.fixme(true, 'PIMS Dynamics leaves these optional answers empty; the likely cause of each is in the comments');
    // The accompanying document is uploaded and virus-scanned before the journey can submit.
    test.setTimeout(test.info().timeout + 2 * 60_000);
    const dynamics = new AnimalsDynamicsClient(externalRequest);
    const answers = ALL_ANSWERS;
    const [cowLine] = answers.commodityLines;
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

    // [NOT IN SCHEMA]
    // None yet.

    // [FROM v0.3.0]
    // specifiedConsignment.originCountry.regionOfOriginCode, the region of origin code (whether one is needed is a journey
    // flag with no column).
    // The event carries it, but the gateway copies only the country code and subdivision, and neither published schema
    // defines it; the planned v0.3.0 message is meant to carry it. The column is a guess, and whether it holds the country
    // prefix is unconfirmed.
    expect.soft(row.defraimp_commoditiesregionoforigin, 'region of origin code').toContain(answers.regionCode);

    // [FROM v0.2.0]
    // specifiedConsignment.transitTradeCountry[], the transited countries.
    // The event carries them. Only the v0.2.0 message does. Whether the column holds codes or names, and its separator, is
    // unconfirmed.
    for (const country of answers.transitedCountries) {
      expect.soft(row.defraimp_routetransitingstates, `transited country ${country.display}`).toContain(country.value);
    }
    // exchangedDocument.referenceDocument[], the accompanying document's reference, issue date and type.
    // The event carries it. Only the v0.2.0 message does. PIMS has a related-documents table this test does not query, so
    // there is no assertion yet.

    // [FROM v0.1.0: NOT IN MESSAGE]
    // None yet.

    // [FROM v0.1.0: OPTION NOT MATCHED?]
    // None yet.

    // [FROM v0.1.0: NOT MAPPED?]
    // specifiedConsignment.includedConsignmentItem[].includedTradeLineItem[].physicalReferencedLogisticsPackage[].itemQuantity,
    // the number of packages.
    // The event carries it and both messages pass it on, but the column is empty. PIMS may not map it, or may store it
    // per species elsewhere. Ask the PIMS team.
    expect.soft(row.defraimp_commoditiesnumberofpackages, 'number of packages').toBe(cowLine.noOfPackages);
    // specifiedConsignment.includedConsignmentItem[].includedTradeLineItem[].individualTradeProductInstance[].identifier[]
    // where typeCode is PASSPORT, the passport number.
    // The event carries it and both messages pass it on, but the identification text column is empty. PIMS has a
    // per-animal identifier table this test does not query, so the passport number may be there. Ask the PIMS team.
    expect.soft(row.defraimp_identificationofanimalstext, 'passport number').toContain(cowLine.passportNumber);
  });

  test('answering yes to unweaned animals is stored in PIMS Dynamics', async ({ animalsJourney, journeyContext, externalRequest }) => {
    test.fixme(true, 'The backend converts a yes answer to false, so PIMS Dynamics shows no unweaned animals');
    const dynamics = new AnimalsDynamicsClient(externalRequest);
    const answers = { ...MANDATORY_ANSWERS, unweanedAnimals: yesNoValues.yes };
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

    // [FROM v0.1.0: NOT IN MESSAGE]
    // specifiedConsignment.isOrHasUnweanedAnimals. The owner is the backend.
    // The PIMS field is "Include Non-Ablacted Animals". The mapping doc says it may be removed from the schema, because
    // PIMS says it is not relevant for the EU journey, pending PO confirmation.
    // The frontend stores 'yes' or 'no', and the backend's Boolean.valueOf is true only for "true", so a yes reaches both
    // messages as false (confirmed on the outbox event). Remove the skip when the backend fix is released. PIMS defaults
    // this column to false, so the mandatory test's no answer proves nothing.
    expect.soft(row.defraimp_commoditiesincludenonablactedanimals, 'unweaned animals').toBe(true);
  });
});
