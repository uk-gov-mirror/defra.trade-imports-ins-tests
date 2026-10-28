import { test, WCAG_STANDARD, scanViewports } from '@fixtures/a11y';

const narrowViewports = {
  'narrow portrait': scanViewports.narrowPortrait,
  'narrow landscape': scanViewports.narrowLandscape,
};

for (const [viewportName, viewport] of Object.entries(narrowViewports)) {
  test.describe(`Accessibility ${WCAG_STANDARD.name}`, { tag: '@a11y' }, () => {
    test.use({ viewport });

    test(`the notification dashboard has no accessibility violations at ${viewportName}`, async ({ animalsJourney, runA11yScan }) => {
      await animalsJourney.toNotificationDashboard();

      await runA11yScan();
    });
  });
}
