import { test, expect } from '@fixtures';
import type { AnimalsSeededJourney } from '@flows/animals/seeded-journey';
import { todayOrTomorrowServiceDisplayDatePattern } from '@utils/date-utils';

test.describe('Declaration page', { tag: '@duplicated-in-frontend' }, () => {
  test.describe('for a draft', () => {
    test.beforeEach(async ({ animalsSeededJourney, animalsJourney }) => {
      await animalsSeededJourney.createDraftNotification();
      await animalsJourney.toDeclarationOfCurrentNotification();
    });

    test('renders the page controls', async ({ animalsPages }) => {
      await expect(animalsPages.declaration.heading).toBeVisible();
      await expect(animalsPages.declaration.confirmation).toBeVisible();
      await expect(animalsPages.declaration.continueButton).toBeVisible();
    });

    test('shows an error summary when submitted unconfirmed', async ({ pages, animalsPages }) => {
      await animalsPages.declaration.continueButton.click();

      await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toBeVisible();
    });

    test('puts the confirmation checkbox in a group named by the declaration legend', async ({ animalsPages }) => {
      await expect(animalsPages.declaration.content.confirmationGroup).toBeVisible();
      await expect(animalsPages.declaration.content.confirmationCheckbox).toBeVisible();
    });

    test('shows the date of declaration as the strong text of its line', async ({ animalsPages }) => {
      await expect(animalsPages.declaration.content.dateValue).toHaveText(new RegExp(`^${todayOrTomorrowServiceDisplayDatePattern()}$`));
    });
  });

  for (const { state, seed } of [
    { state: 'a draft', seed: (journey: AnimalsSeededJourney) => journey.createDraftNotification() },
    { state: 'an amendment', seed: (journey: AnimalsSeededJourney) => journey.createAmendNotification() },
  ]) {
    test(`starts the declaration of ${state} with the Declaration heading`, async ({
      animalsSeededJourney,
      animalsJourney,
      animalsPages,
    }) => {
      await seed(animalsSeededJourney);
      await animalsJourney.toDeclarationOfCurrentNotification();

      await expect(animalsPages.declaration.content.firstContentElement).toHaveText('Declaration');
    });
  }
});
