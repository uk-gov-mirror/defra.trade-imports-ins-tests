import { test, WCAG_STANDARD } from '@fixtures/a11y';
import { COLD_START } from '@fixtures/auth-state';

test.use({ storageState: COLD_START });

const stubErrorSummaryList = '.govuk-error-summary__list';

test.describe(`Accessibility ${WCAG_STANDARD.name}`, { tag: '@a11y' }, () => {
  test('the sign-in page has no accessibility violations on initial load and with an error', async ({ pages, insPages, runA11yScan }) => {
    await insPages.dashboard.open(false);

    await test.step('Sign in', async () => {
      await runA11yScan();
    });

    await test.step('Sign in with an error', async () => {
      await pages.signIn.signIn({ userId: 'invalid' });
      await pages.signIn.errorSummary.waitFor();
      await runA11yScan({ exclude: stubErrorSummaryList });
    });
  });

  test('the unauthorised page has no accessibility violations', async ({ pages, runA11yScan }) => {
    await pages.page.goto('/auth/sign-in-oidc?code=invalid&state=invalid');
    await pages.page.getByRole('heading', { name: 'Sorry, we are unable to sign you in.' }).waitFor();

    await runA11yScan();
  });
});
