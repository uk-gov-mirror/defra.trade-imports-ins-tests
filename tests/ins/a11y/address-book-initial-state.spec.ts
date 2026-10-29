import { test, WCAG_STANDARD } from '@fixtures/a11y';

test.describe(`Accessibility ${WCAG_STANDARD.name}`, { tag: '@a11y' }, () => {
  test('the blank add address form has no accessibility violations', async ({ insPages, runA11yScan }) => {
    await insPages.addressBookAdd.open();
    await insPages.addressBookAdd.heading.waitFor();

    await runA11yScan();
  });
});
