import { AnimalsDynamicsClient } from '@adapters/http/animals-dynamics-client';
import { formattedValue } from '@adapters/http/dataverse-client';
import { animalsDynamics } from '@config/animals-dynamics';
import { countryCodes } from '@domain/animals/constants/country-codes';
import type { AnimalsDynamicsImporterNotification } from '@domain/animals/models/dynamics/importer-notification';
import { test, expect } from '@fixtures';
import { annotateDuration } from '@utils/playwright/annotate-duration';
import { skipIfComposeEnvironment } from '@utils/playwright/environment';

const SUBMISSION_COLUMNS = [
  'defraimp_name',
  'defraimp_status',
  'defraimp_version',
  'defraimp_submissiondate',
] as const satisfies readonly (keyof AnimalsDynamicsImporterNotification)[];

const AMENDMENT_COLUMNS = [
  'defraimp_version',
  'defraimp_status',
  '_defraimp_countryoforiginid_value',
] as const satisfies readonly (keyof AnimalsDynamicsImporterNotification)[];

const DELETION_COLUMNS = ['statecode', 'statuscode'] as const satisfies readonly (keyof AnimalsDynamicsImporterNotification)[];

const exactlyOneNotification = (referenceNumber: string) =>
  animalsDynamics.pollOptions(`Expected exactly one notification for ${referenceNumber}`);

// Traces record APIRequestContext calls with their headers and form bodies: the bearer token and client secret.
// Top level because Playwright rejects test.use({ trace }) inside a describe group.
test.use({ trace: 'off' });

test.describe('PIMS Dynamics notification events', { tag: '@dynamics' }, () => {
  test.beforeEach(() => {
    skipIfComposeEnvironment('the compose stack has no PIMS Dynamics');
    // The slowed UI journey plus the PIMS Dynamics poll.
    test.slow();
    test.setTimeout(test.info().timeout + animalsDynamics.arrivalTimeoutMs);
  });

  test('submitting a notification creates one PIMS Dynamics record', async ({ animalsJourney, journeyContext, externalRequest }) => {
    // Built first: a missing ANIMALS_DYNAMICS_URL / DATAVERSE_* secret fails here, before the journey.
    const dynamics = new AnimalsDynamicsClient(externalRequest);
    await animalsJourney.submitNotification();
    const submittedAt = Date.now();
    const referenceNumber = journeyContext.referenceNumber;

    await annotateDuration(animalsDynamics.submissionPollAnnotation, () =>
      expect
        .poll(() => dynamics.findNotificationsScopedToColumns(referenceNumber, SUBMISSION_COLUMNS), exactlyOneNotification(referenceNumber))
        .toHaveLength(1),
    );

    // expect.poll doesn't return the matched value, so fetch the row once more to check its columns.
    const [row] = await dynamics.findNotificationsScopedToColumns(referenceNumber, SUBMISSION_COLUMNS);
    expect.soft(row.defraimp_name).toBe(referenceNumber);
    expect.soft(formattedValue(row, 'defraimp_status')).toBe('Submitted');
    expect.soft(row.defraimp_version).toBe(1);
    expect.soft(row.defraimp_submissiondate).not.toBeNull();
    expect
      .soft(Math.abs(Date.parse(row.defraimp_submissiondate ?? '') - submittedAt))
      .toBeLessThan(animalsDynamics.submissionDateToleranceMs);
  });

  test('amending a submitted notification updates its PIMS Dynamics record to version 2 with the new country of origin', async ({
    animalsJourney,
    animalsNotificationActions,
    journeyContext,
    externalRequest,
  }) => {
    test.fixme(true, 'The amendment never moves the PIMS Dynamics record to version 2; the cause is being investigated');
    // The amend journey plus the amendment's PIMS Dynamics poll.
    test.setTimeout(test.info().timeout + 10 * 60_000);
    const dynamics = new AnimalsDynamicsClient(externalRequest);
    const amendedCountry = countryCodes.eu.belgium;
    await animalsJourney.submitNotification();
    const referenceNumber = journeyContext.referenceNumber;

    await annotateDuration(animalsDynamics.submissionPollAnnotation, () =>
      expect
        .poll(() => dynamics.findNotificationsScopedToColumns(referenceNumber, AMENDMENT_COLUMNS), exactlyOneNotification(referenceNumber))
        .toHaveLength(1),
    );

    await animalsNotificationActions.amendCountryOfOriginAndResubmit(referenceNumber, amendedCountry);

    await annotateDuration('PIMS Dynamics amendment poll', () =>
      expect
        .poll(
          async () =>
            (await dynamics.findNotificationsScopedToColumns(referenceNumber, AMENDMENT_COLUMNS)).map((row) => row.defraimp_version),
          animalsDynamics.pollOptions(`Expected one notification for ${referenceNumber} at version 2`, 10 * 60_000),
        )
        .toEqual([2]),
    );

    const [row] = await dynamics.findNotificationsScopedToColumns(referenceNumber, AMENDMENT_COLUMNS);
    expect.soft(formattedValue(row, 'defraimp_status')).toBe('Submitted');
    expect.soft(formattedValue(row, '_defraimp_countryoforiginid_value')).toBe(amendedCountry.display);
  });

  test('deleting a submitted notification deactivates its PIMS Dynamics record', async ({
    animalsJourney,
    animalsNotificationActions,
    journeyContext,
    externalRequest,
  }) => {
    // The backend already emits NotificationSubmissionDeleted, but the gateway's allow-list drops it, so adding
    // that one entry (plus a forwarding test) is our only change, to be merged once PIMS can consume it.
    test.fixme(true, 'The dynamics gateway does not forward NotificationSubmissionDeleted to PIMS Dynamics yet');
    // The delete journey plus the deletion's PIMS Dynamics poll.
    test.setTimeout(test.info().timeout + 5 * 60_000);
    const dynamics = new AnimalsDynamicsClient(externalRequest);
    await animalsJourney.submitNotification();
    const referenceNumber = journeyContext.referenceNumber;

    await annotateDuration(animalsDynamics.submissionPollAnnotation, () =>
      expect
        .poll(() => dynamics.findNotificationsScopedToColumns(referenceNumber, DELETION_COLUMNS), exactlyOneNotification(referenceNumber))
        .toHaveLength(1),
    );

    await animalsNotificationActions.deleteNotification(referenceNumber);

    // Unconfirmed: PIMS Dynamics has not yet said how it records a deletion, so 'Inactive' is a best guess.
    await annotateDuration('PIMS Dynamics deletion poll', () =>
      expect
        .poll(
          async () =>
            (await dynamics.findNotificationsScopedToColumns(referenceNumber, DELETION_COLUMNS)).map((row) =>
              formattedValue(row, 'statecode'),
            ),
          animalsDynamics.pollOptions(`Expected one inactive notification for ${referenceNumber}`, 5 * 60_000),
        )
        .toEqual(['Inactive']),
    );

    const [row] = await dynamics.findNotificationsScopedToColumns(referenceNumber, DELETION_COLUMNS);
    // Unconfirmed: PIMS Dynamics has not yet said which status reason a deleted notification gets, so 'Inactive' is a best guess.
    expect.soft(formattedValue(row, 'statuscode')).toBe('Inactive');
  });
});
