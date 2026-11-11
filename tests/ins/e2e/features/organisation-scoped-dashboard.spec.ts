import { test, expect } from '@fixtures';
import { timeouts } from '@config/timeouts';

test.describe(
  'Organisation-scoped INS dashboard',
  {
    tag: ['@animals-backend', '@animals-frontend'],
  },
  () => {
    test('the owning organisation sees its submitted notification on the INS dashboard', async ({
      animalsJourney,
      journeyContext,
      insPages,
      pages,
      animalsPages,
    }) => {
      test.slow();

      await animalsJourney.toDeclaration();
      const referenceNumber = journeyContext.referenceNumber;
      await animalsPages.declaration.confirmation.check();
      await animalsPages.declaration.continueButton.click();
      await pages.page.getByRole('heading', { name: 'Import notification submitted' }).waitFor();

      await insPages.dashboard.open();
      await expect
        .poll(
          async () => {
            await insPages.dashboard.searchForReference(referenceNumber);
            return insPages.dashboard.viewLink(referenceNumber).count();
          },
          { timeout: timeouts.long },
        )
        .toBe(1);
    });
  },
);
