import { test, expect } from '@fixtures';
import { portByCode } from '@resources/reference-data/reference-data';
import { POTATOES } from '@flows/plants/journey';
import { PLACE_OF_LANDING_SEARCH_PLACEHOLDER } from '@domain/plants/constants/arrival-details-page';
import { getRelativeAppDateText } from '@utils/date-utils';

const FRANCE = 'France';

const ARRIVAL_TASK_ROW = 'Arrival details';

const ALREADY_ARRIVED = 'Yes, it has already arrived';
const NOT_YET_ARRIVED = 'No, it has not arrived yet';

const ARRIVAL_STATUS_ERROR = 'Select whether the consignment has arrived';

const ARRIVAL_DATE_ERROR = 'Enter the arrival date';
const REAL_ARRIVAL_DATE_ERROR = 'Enter a real arrival date';
const ARRIVAL_TIME_ERROR = 'Enter the expected time of arrival';
const PLACE_OF_LANDING_ERROR = 'Select the proposed place of landing';
const REAL_TIME_ERROR = 'Enter a real time, like 14:30';

const NOT_ON_THE_CLOCK = '25:00';

const NOT_A_REAL_DATE = '31/2/2026';

const POTATO_DATE_LABEL = 'Expected date of arrival';
const PRE_ARRIVAL_DATE_LABEL = 'Expected date of landing in Great Britain';
const POST_ARRIVAL_DATE_LABEL = 'Date the consignment first arrived in Great Britain';

const PRE_ARRIVAL_DESTINATION_HEADING = 'Place of destination';
const POST_ARRIVAL_DESTINATION_HEADING = 'Where is the consignment now?';

const DAYS_LATE = 30;

const ARRIVED_ON = getRelativeAppDateText({ dayOffset: -DAYS_LATE });

const ARRIVING_ON = '27/3/2027';
const ARRIVING_AT = '14:30';

const ABERDEEN_HARBOUR = portByCode('GB ABD').display;

const PLACE_OF_LANDING_HINT = 'Select where the potatoes will enter Great Britain. Start typing to search by port or airport name or code.';

const POTATO_DATE_HINT = 'For example, 27/3/2026. If the potatoes have already arrived, enter the date they arrived.';

const POST_ARRIVAL_HINT =
  'You are making a post-arrival notification. It must be made no later than 4 days after the date of arrival. You will give the date it arrived and where it is now.';

const PRE_ARRIVAL_HINT =
  'You are making a pre-arrival notification. You will give the expected date of landing and the intended destination.';

test.describe('High-risk plants arrival section', () => {
  test('the arrival-status question offers both branches, and the post-arrival one quotes the window', async ({
    pages,
    plantsPages,
    plantsJourney,
  }) => {
    const reference = await plantsJourney.toArrivalStatusOfNewPlantsNotification();

    await expect(pages.page).toHaveURL(plantsPages.arrivalStatus.expectedUrl(reference));
    await expect(plantsPages.arrivalStatus.heading).toBeVisible();
    await expect(plantsPages.arrivalStatus.arrivalStatus(ALREADY_ARRIVED)).not.toBeChecked();
    await expect(plantsPages.arrivalStatus.arrivalStatus(NOT_YET_ARRIVED)).not.toBeChecked();
    await expect(plantsPages.arrivalStatus.arrivalStatusHint(ALREADY_ARRIVED)).toHaveText(POST_ARRIVAL_HINT);
    await expect(plantsPages.arrivalStatus.arrivalStatusHint(NOT_YET_ARRIVED)).toHaveText(PRE_ARRIVAL_HINT);
  });

  test('the question must be answered before the notification moves on', async ({ pages, plantsPages, plantsJourney }) => {
    const reference = await plantsJourney.toArrivalStatusOfNewPlantsNotification();

    await plantsPages.arrivalStatus.saveAndContinue.click();

    await expect(pages.page).toHaveURL(plantsPages.arrivalStatus.expectedUrl(reference));
    await expect(plantsPages.arrivalStatus.errorSummary).toContainText(ARRIVAL_STATUS_ERROR);
  });

  test('the answer is saved, shown again on return, and carries on to the arrival details', async ({
    pages,
    plantsPages,
    plantsJourney,
  }) => {
    const reference = await plantsJourney.toArrivalStatusOfNewPlantsNotification();

    await plantsPages.arrivalStatus.arrivalStatus(ALREADY_ARRIVED).check();
    await plantsPages.arrivalStatus.saveAndContinue.click();

    await expect(pages.page).toHaveURL(plantsPages.arrivalDetails.expectedUrl(reference));

    await plantsPages.arrivalStatus.open(reference);
    await expect(plantsPages.arrivalStatus.arrivalStatus(ALREADY_ARRIVED)).toBeChecked();
  });

  test('the arrival date is asked under the sentence the arrival status chose', async ({ plantsPages, plantsJourney }) => {
    await plantsJourney.toArrivalStatusOfNewPlantsNotification();
    await plantsJourney.answerArrivalStatus(NOT_YET_ARRIVED);

    await expect(plantsPages.arrivalDetails.dateQuestionLabelled(PRE_ARRIVAL_DATE_LABEL)).toBeVisible();

    await expect(plantsPages.arrivalDetails.arrivalTime).toHaveCount(0);
    await expect(plantsPages.arrivalDetails.placeOfLanding.field).toHaveCount(0);
  });

  test('the arrival date must be given before the notification moves on', async ({ pages, plantsPages, plantsJourney }) => {
    const reference = await plantsJourney.toArrivalStatusOfNewPlantsNotification();
    await plantsJourney.answerArrivalStatus(ALREADY_ARRIVED);

    await plantsPages.arrivalDetails.saveAndContinue.click();

    await expect(pages.page).toHaveURL(plantsPages.arrivalDetails.expectedUrl(reference));
    await expect(plantsPages.arrivalDetails.errorSummary).toContainText(ARRIVAL_DATE_ERROR);
  });

  test('a date long past the four-day window is saved, shown again on return, and completes the arrival task row', async ({
    pages,
    plantsPages,
    plantsJourney,
  }) => {
    const reference = await plantsJourney.toArrivalStatusOfNewPlantsNotification();
    await plantsJourney.answerArrivalStatus(ALREADY_ARRIVED);

    await expect(plantsPages.arrivalDetails.dateQuestionLabelled(POST_ARRIVAL_DATE_LABEL)).toBeVisible();
    await plantsPages.arrivalDetails.arrivalDate.fill(ARRIVED_ON);
    await plantsPages.arrivalDetails.saveAndContinue.click();

    await expect(pages.page).toHaveURL(plantsPages.placeOfDestination.expectedUrl(reference));
    await expect(plantsPages.placeOfDestination.headingNamed(POST_ARRIVAL_DESTINATION_HEADING)).toBeVisible();

    await plantsPages.overview.open(reference);
    await expect(plantsPages.overview.taskRow(ARRIVAL_TASK_ROW)).toContainText('Completed');

    await plantsPages.arrivalDetails.open(reference);
    await expect(plantsPages.arrivalDetails.arrivalDate).toHaveValue(ARRIVED_ON);
  });

  test('changing the answer from arrived to not arrived re-labels the question and keeps the date', async ({
    pages,
    plantsPages,
    plantsJourney,
  }) => {
    const reference = await plantsJourney.toArrivalStatusOfNewPlantsNotification();
    await plantsJourney.answerArrivalStatus(ALREADY_ARRIVED);
    await plantsPages.arrivalDetails.arrivalDate.fill(ARRIVED_ON);
    await plantsPages.arrivalDetails.saveAndContinue.click();
    await expect(pages.page).toHaveURL(plantsPages.placeOfDestination.expectedUrl(reference));

    await plantsPages.arrivalStatus.open(reference);
    await plantsPages.arrivalStatus.arrivalStatus(NOT_YET_ARRIVED).check();
    await plantsPages.arrivalStatus.saveAndContinue.click();

    await expect(pages.page).toHaveURL(plantsPages.arrivalDetails.expectedUrl(reference));
    await expect(plantsPages.arrivalDetails.dateQuestionLabelled(PRE_ARRIVAL_DATE_LABEL)).toBeVisible();
    await expect(plantsPages.arrivalDetails.arrivalDate).toHaveValue(ARRIVED_ON);
  });

  test('a date that names no day on the calendar is refused', async ({ pages, plantsPages, plantsJourney }) => {
    const reference = await plantsJourney.toArrivalStatusOfNewPlantsNotification();
    await plantsJourney.answerArrivalStatus(NOT_YET_ARRIVED);

    await plantsPages.arrivalDetails.arrivalDate.fill(NOT_A_REAL_DATE);
    await plantsPages.arrivalDetails.saveAndContinue.click();

    await expect(pages.page).toHaveURL(plantsPages.arrivalDetails.expectedUrl(reference));
    await expect(plantsPages.arrivalDetails.errorSummary).toContainText(REAL_ARRIVAL_DATE_ERROR);
    await expect(plantsPages.arrivalDetails.errorSummary).not.toContainText(ARRIVAL_DATE_ERROR);
  });

  test('a potato notification is never asked the question and opens the arrival row on the details', async ({
    pages,
    plantsPages,
    plantsJourney,
  }) => {
    const reference = await plantsJourney.toOriginOfNewNotification(POTATOES);

    await plantsJourney.toArrivalDetails(FRANCE);

    await expect(pages.page).toHaveURL(plantsPages.arrivalDetails.expectedUrl(reference));
    await expect(plantsPages.arrivalDetails.dateQuestionLabelled(POTATO_DATE_LABEL)).toBeVisible();

    await plantsPages.overview.open(reference);
    await expect(plantsPages.overview.taskRowLink(ARRIVAL_TASK_ROW)).toHaveAttribute(
      'href',
      plantsPages.arrivalDetails.expectedUrl(reference),
    );
  });

  test('save and return to overview: when a potato arrival page is blank, refuses the save, names each missing answer and leaves the arrival row not started', async ({
    pages,
    plantsPages,
    plantsJourney,
  }) => {
    const reference = await plantsJourney.toArrivalDetailsOfNewPotatoNotification();

    await plantsPages.arrivalDetails.saveAndReturnToOverview.click();

    await expect(pages.page).toHaveURL(plantsPages.arrivalDetails.expectedUrl(reference));
    await expect(plantsPages.arrivalDetails.errorSummaryLinks).toHaveText([
      'Enter the arrival date',
      'Enter the expected time of arrival',
      'Select the proposed place of landing',
    ]);
    await plantsPages.overview.open(reference);
    await expect(plantsPages.overview.taskRow(ARRIVAL_TASK_ROW)).toContainText('Not yet started');
  });

  test('save and return to overview: when the time is not on the 24-hour clock, refuses the save', async ({
    pages,
    plantsPages,
    plantsJourney,
  }) => {
    const reference = await plantsJourney.toArrivalDetailsOfNewPotatoNotification();

    await plantsPages.arrivalDetails.arrivalDate.fill(ARRIVING_ON);
    await plantsPages.arrivalDetails.arrivalTime.fill(NOT_ON_THE_CLOCK);
    await plantsPages.arrivalDetails.placeOfLanding.choose(ABERDEEN_HARBOUR);
    await plantsPages.arrivalDetails.saveAndReturnToOverview.click();

    await expect(pages.page).toHaveURL(plantsPages.arrivalDetails.expectedUrl(reference));
    await expect(plantsPages.arrivalDetails.errorSummary).toContainText(REAL_TIME_ERROR);

    await plantsPages.overview.open(reference);
    await plantsPages.overview.taskRowLink(ARRIVAL_TASK_ROW).click();
    await expect(plantsPages.arrivalDetails.arrivalTime).toHaveValue('');
    await expect(plantsPages.arrivalDetails.arrivalDate).toHaveValue('');
    await expect(plantsPages.arrivalDetails.placeOfLanding.field).toHaveValue('');
  });

  test('save and return to overview: when a date is typed, saves it and shows it again on return', async ({
    pages,
    plantsPages,
    plantsJourney,
  }) => {
    const reference = await plantsJourney.toArrivalStatusOfNewPlantsNotification();
    await plantsJourney.answerArrivalStatus(ALREADY_ARRIVED);

    await plantsPages.arrivalDetails.arrivalDate.fill(ARRIVED_ON);
    await plantsPages.arrivalDetails.saveAndReturnToOverview.click();

    await expect(pages.page).toHaveURL(plantsPages.overview.expectedUrl(reference));

    await plantsPages.arrivalDetails.open(reference);
    await expect(plantsPages.arrivalDetails.arrivalDate).toHaveValue(ARRIVED_ON);
  });

  test('a potato notification is asked the time and the place of landing as well as the date', async ({
    pages,
    plantsPages,
    plantsJourney,
  }) => {
    const reference = await plantsJourney.toArrivalDetailsOfNewPotatoNotification();

    await plantsPages.arrivalDetails.saveAndContinue.click();

    await expect(plantsPages.arrivalDetails.errorSummary).toContainText(ARRIVAL_DATE_ERROR);
    await expect(plantsPages.arrivalDetails.errorSummary).toContainText(ARRIVAL_TIME_ERROR);
    await expect(plantsPages.arrivalDetails.errorSummary).toContainText(PLACE_OF_LANDING_ERROR);

    await plantsPages.arrivalDetails.arrivalDate.fill(ARRIVING_ON);
    await plantsPages.arrivalDetails.arrivalTime.fill(ARRIVING_AT);
    await plantsPages.arrivalDetails.placeOfLanding.choose(ABERDEEN_HARBOUR);
    await plantsPages.arrivalDetails.saveAndContinue.click();

    await expect(pages.page).toHaveURL(plantsPages.placeOfDestination.expectedUrl(reference));
    await expect(plantsPages.placeOfDestination.headingNamed(PRE_ARRIVAL_DESTINATION_HEADING)).toBeVisible();

    await plantsPages.overview.open(reference);
    await expect(plantsPages.overview.taskRow(ARRIVAL_TASK_ROW)).toContainText('Completed');

    await plantsPages.arrivalDetails.open(reference);
    await expect(plantsPages.arrivalDetails.arrivalDate).toHaveValue(ARRIVING_ON);
    await expect(plantsPages.arrivalDetails.arrivalTime).toHaveValue(ARRIVING_AT);
    await expect(plantsPages.arrivalDetails.placeOfLanding.field).toHaveValue(ABERDEEN_HARBOUR);
  });

  test('a potato notification hints the place of landing and shows Select a place of landing in its empty search box', async ({
    plantsPages,
    plantsJourney,
  }) => {
    await plantsJourney.toArrivalDetailsOfNewPotatoNotification();

    await expect(plantsPages.arrivalDetails.fieldHint('proposedPlaceOfLanding')).toHaveText(PLACE_OF_LANDING_HINT);
    await expect(plantsPages.arrivalDetails.placeOfLanding.field).toHaveAttribute('placeholder', PLACE_OF_LANDING_SEARCH_PLACEHOLDER);
    await expect(plantsPages.arrivalDetails.placeOfLanding.field).toHaveValue('');
  });

  test('the arrival date hint on a potato notification reads its worked example', async ({ plantsPages, plantsJourney }) => {
    await plantsJourney.toArrivalDetailsOfNewPotatoNotification();

    await expect(plantsPages.arrivalDetails.fieldHint('arrivalDate')).toHaveText(POTATO_DATE_HINT);
  });
});
