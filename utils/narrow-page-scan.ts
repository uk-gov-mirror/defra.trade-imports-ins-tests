import type { Page } from '@playwright/test';
import { expect } from '@fixtures/a11y';
import type { A11yFixtures } from '@fixtures/a11y';

const scrollsSidewaysOutsideTables = (page: Page): Promise<boolean> =>
  page.evaluate(() => {
    const tables = [...document.querySelectorAll<HTMLElement>('table')];
    const displays = tables.map((table) => table.style.display);
    tables.forEach((table) => {
      table.style.display = 'none';
    });
    const scrollsSideways = document.documentElement.scrollWidth > document.documentElement.clientWidth;
    tables.forEach((table, index) => {
      table.style.display = displays[index];
    });
    return scrollsSideways;
  });

export const scanNarrowPage = async (page: Page, runA11yScan: A11yFixtures['runA11yScan']): Promise<void> => {
  await expect.soft(scrollsSidewaysOutsideTables(page), `${page.url()} scrolls sideways`).resolves.toBe(false);
  await runA11yScan();
};
