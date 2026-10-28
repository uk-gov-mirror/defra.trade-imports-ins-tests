import { test, WCAG_STANDARD } from '@fixtures/a11y';
import { COLD_START } from '@fixtures/auth-state';

// This spec IS the sign-in journey, so it starts unauthenticated.
test.use({ storageState: COLD_START });

// The sign-in stub's own error-summary list fails axe's list-structure rule —
// stub code we don't own (docs/security.md), not a defect in this service.
const stubErrorSummaryList = '.govuk-error-summary__list';

test.describe(`Accessibility ${WCAG_STANDARD.name}`, { tag: '@a11y' }, () => {
  test('the sign-in page has no accessibility violations on initial load and with an error', async ({
    animalsJourney,
    pages,
    animalsPages,
    runA11yScan,
  }) => {
    await animalsJourney.toSignIn((attemptSignIn) => animalsPages.dashboard.open(attemptSignIn));

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
