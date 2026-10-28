import type { Page } from '@playwright/test';
import { test, expect, WCAG_STANDARD } from '@fixtures/a11y';
import { scanPage } from '@utils/a11y-utils';

const injectUnnamedButton = (page: Page): Promise<void> =>
  page.evaluate(() => {
    document.body.append(document.createElement('button'));
  });

const injectAdjacentSmallTargets = (page: Page): Promise<void> =>
  page.evaluate(() => {
    const smallTargets = document.createElement('div');
    for (const name of ['first', 'second']) {
      const target = document.createElement('a');
      target.href = '#';
      target.setAttribute('aria-label', `Injected ${name} small target`);
      target.style.cssText = 'display:inline-block;width:8px;height:8px;';
      smallTargets.append(target);
    }
    document.body.append(smallTargets);
  });

test.describe(`Accessibility ${WCAG_STANDARD.name}`, { tag: '@a11y' }, () => {
  test.beforeEach(async ({ animalsJourney }) => {
    await animalsJourney.toNotificationDashboard();
  });

  test('the scan reports an unnamed button and targets too small and too close to press', async ({ page }) => {
    await injectUnnamedButton(page);
    await injectAdjacentSmallTargets(page);

    const { violations } = await scanPage(page, { tags: [...WCAG_STANDARD.tags] });

    expect(violations.map(({ id }) => id)).toEqual(expect.arrayContaining(['button-name', 'target-size']));
  });

  test.describe('failing the test', () => {
    test.describe.configure({ retries: 0 });

    test.fail('the a11y scan fixture fails the test when the page has a violation', async ({ page, runA11yScan }) => {
      await injectUnnamedButton(page);

      await runA11yScan();
    });
  });
});
