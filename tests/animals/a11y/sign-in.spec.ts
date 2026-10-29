import { test, WCAG_STANDARD } from '@fixtures/a11y';
import { COLD_START } from '@fixtures/auth-state';

test.use({ storageState: COLD_START });

test.describe(`Accessibility ${WCAG_STANDARD.name}`, { tag: '@a11y' }, () => {
  test('the unauthorised page has no accessibility violations', async ({ pages, runA11yScan }) => {
    await pages.page.goto('/auth/sign-in-oidc?code=invalid&state=invalid');
    await pages.page.getByRole('heading', { name: 'Sorry, we are unable to sign you in.' }).waitFor();

    await runA11yScan();
  });
});
