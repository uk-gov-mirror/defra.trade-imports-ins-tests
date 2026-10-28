import { test, expect } from '@fixtures';
import { meansOfTransport } from '@domain/animals/constants/means-of-transport';
import { expectEmptyTransitList } from '@utils/transit-countries-assertions';

const TRANSPORT_AND_ARRIVAL_HEADING = '3. Transport and arrival';
const TASKS_WITHOUT_TRANSIT_COUNTRIES = ['Arrival details', 'Transport details'];
const TASKS_WITH_TRANSIT_COUNTRIES = ['Arrival details', 'Transit countries', 'Transport details'];

test.describe('Transit countries scope', { tag: '@duplicated-in-frontend' }, () => {
  test('the transit-countries page is routed only for rail or road; changing the means wipes saved countries', async ({
    animalsJourney,
    animalsPages,
  }) => {
    await animalsJourney.startNotification();
    await animalsJourney.answerCommodity();

    const saveArrivalWithMeans = async (means: string) => {
      await animalsPages.overview.task('Arrival details').click();
      await expect(animalsPages.arrivalDetails.heading).toBeVisible();
      await animalsJourney.fillArrivalDetails({ means });
      await animalsPages.arrivalDetails.saveAndContinue.click();
      await expect(animalsPages.overview.heading).toBeVisible();
    };

    await saveArrivalWithMeans(meansOfTransport.airplane.display);
    await expect(animalsPages.overview.taskTitlesInSectionHeaded(TRANSPORT_AND_ARRIVAL_HEADING)).toHaveText(
      TASKS_WITHOUT_TRANSIT_COUNTRIES,
    );

    await saveArrivalWithMeans(meansOfTransport.railway.display);
    await expect(animalsPages.overview.taskTitlesInSectionHeaded(TRANSPORT_AND_ARRIVAL_HEADING)).toHaveText(TASKS_WITH_TRANSIT_COUNTRIES);
    await expect(animalsPages.overview.taskStatus('Transit countries')).toHaveText('To do');

    await saveArrivalWithMeans(meansOfTransport.roadVehicle.display);
    await expect(animalsPages.overview.taskTitlesInSectionHeaded(TRANSPORT_AND_ARRIVAL_HEADING)).toHaveText(TASKS_WITH_TRANSIT_COUNTRIES);
    await animalsPages.overview.task('Transit countries').click();
    await expect(animalsPages.transitedCountries.heading).toBeVisible();
    await animalsPages.transitedCountries.addCountry('France');
    await animalsPages.transitedCountries.addCountry('Belgium');
    await animalsPages.transitedCountries.saveAndContinue.click();
    await expect(animalsPages.overview.heading).toBeVisible();
    await expect(animalsPages.overview.taskStatus('Transit countries')).toHaveText('Complete');

    await saveArrivalWithMeans(meansOfTransport.vessel.display);
    await expect(animalsPages.overview.taskTitlesInSectionHeaded(TRANSPORT_AND_ARRIVAL_HEADING)).toHaveText(
      TASKS_WITHOUT_TRANSIT_COUNTRIES,
    );

    await saveArrivalWithMeans(meansOfTransport.roadVehicle.display);
    await animalsPages.overview.task('Transit countries').click();
    await expect(animalsPages.transitedCountries.heading).toBeVisible();
    await expectEmptyTransitList(animalsPages.transitedCountries);
  });
});
