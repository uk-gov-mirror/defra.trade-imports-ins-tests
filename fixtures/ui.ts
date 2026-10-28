import { test as base, expect, type APIRequestContext, type BrowserContext, type Page, type TestInfo } from '@playwright/test';
import {
  createAnimalsAdminPages,
  createAnimalsPages,
  createInsPages,
  createPlantsPages,
  createSharedPages,
  type AnimalsAdminPages,
  type AnimalsPages,
  type InsPages,
  type PlantsPages,
  type SharedPages,
} from '@page-objects';
import { JourneyContext } from '@flows/shared/journey-context';
import { AnimalsJourney } from '@flows/animals/journey';
import { AnimalsNotificationActions } from '@flows/animals/notification-actions';
import { AnimalsSeededJourney } from '@flows/animals/seeded-journey';
import { AnimalsAdminNavigation } from '@flows/animals-admin/navigation';
import { PlantsJourney } from '@flows/plants/journey';
import { PlantsNotificationActions } from '@flows/plants/notification-actions';
import { NotificationApiClient } from '@adapters/http/notification-api-client';
import { AddressBookApiClient } from '@adapters/http/address-book-api-client';
import { ReferenceDataApiClient } from '@adapters/http/reference-data-api-client';
import { FrontendFormClient } from '@adapters/http/frontend-form-client';
import { authCookieNameFor, createWorkerAuthStates, stripToAuthCookie, type AuthStateFor } from '@fixtures/auth-state';
import { createFrontendSeedContext } from '@fixtures/seed-context';
import { getCdpProxy } from '@config/cdp-proxy';
import { baseUrlForDomain, domainFromSpecPath } from '@utils/playwright/domain-base-urls';
import { sessionReuseEnabled } from '@utils/playwright/session-reuse';

const SESSION_MINT_TIMEOUT_MS = 120_000;

const domainOf = ({ file, project }: TestInfo) => domainFromSpecPath(file, project.testDir);

export interface AuthWorkerFixtures {
  authStateFor: AuthStateFor | undefined;
  frontendSeedContext: APIRequestContext;
}

export interface FreshSessionAfterSubmit<DomainPages> {
  reference: string;
  freshPages: DomainPages;
  freshSharedPages: SharedPages;
}

export interface PageFixtures {
  pages: SharedPages;
  animalsPages: AnimalsPages;
  animalsAdminPages: AnimalsAdminPages;
  insPages: InsPages;
  plantsPages: PlantsPages;
  journeyContext: JourneyContext;
  animalsJourney: AnimalsJourney;
  animalsSeededJourney: AnimalsSeededJourney;
  animalsNotificationActions: AnimalsNotificationActions;
  animalsAdminNavigation: AnimalsAdminNavigation;
  plantsJourney: PlantsJourney;
  plantsNotificationActions: PlantsNotificationActions;
  notificationApi: NotificationApiClient;
  addressBookApi: AddressBookApiClient;
  referenceDataApi: ReferenceDataApiClient;
  frontendForms: FrontendFormClient;
  externalRequest: APIRequestContext;
  openFreshSession: () => Promise<Page>;
  submitAnimalsNotificationThenOpenFreshSession: () => Promise<FreshSessionAfterSubmit<AnimalsPages>>;
  submitPlantsNotificationThenOpenFreshSession: () => Promise<FreshSessionAfterSubmit<PlantsPages>>;
}

export const test = base.extend<PageFixtures, AuthWorkerFixtures>({
  authStateFor: [
    async ({ browser }, use, workerInfo) => {
      await use(sessionReuseEnabled() ? createWorkerAuthStates(browser, workerInfo) : undefined);
    },
    { scope: 'worker' },
  ],
  frontendSeedContext: [
    async ({ browser, authStateFor }, use, workerInfo) => {
      const context = await createFrontendSeedContext(browser, workerInfo, authStateFor);
      await use(context);
      await context.dispose();
    },
    { scope: 'worker', timeout: SESSION_MINT_TIMEOUT_MS },
  ],
  // eslint-disable-next-line no-empty-pattern
  baseURL: async ({}, use, testInfo) => {
    await use(baseUrlForDomain(domainOf(testInfo)));
  },
  storageState: [
    async ({ authStateFor }, use, testInfo) => {
      await use(authStateFor ? await authStateFor(domainOf(testInfo)) : undefined);
    },
    { scope: 'test', timeout: SESSION_MINT_TIMEOUT_MS },
  ],
  pages: async ({ page }, use) => {
    await use(createSharedPages(page));
  },
  animalsPages: async ({ page }, use) => {
    await use(createAnimalsPages(page));
  },
  animalsAdminPages: async ({ page }, use) => {
    await use(createAnimalsAdminPages(page));
  },
  insPages: async ({ page }, use) => {
    await use(createInsPages(page));
  },
  plantsPages: async ({ page }, use) => {
    await use(createPlantsPages(page));
  },
  // eslint-disable-next-line no-empty-pattern
  journeyContext: async ({}, use, testInfo) => {
    const journeyContext = new JourneyContext();
    await use(journeyContext);
    for (const referenceNumber of journeyContext.referenceNumbers) {
      testInfo.annotations.push({ type: 'Reference number', description: referenceNumber });
    }
  },
  animalsJourney: async ({ animalsPages, pages, journeyContext }, use) => {
    await use(new AnimalsJourney(animalsPages, pages, journeyContext));
  },
  animalsNotificationActions: async ({ animalsPages, pages, journeyContext }, use) => {
    await use(new AnimalsNotificationActions(animalsPages, pages, journeyContext));
  },
  animalsAdminNavigation: async ({ animalsAdminPages }, use) => {
    await use(new AnimalsAdminNavigation(animalsAdminPages));
  },
  plantsJourney: async ({ plantsPages, journeyContext }, use) => {
    await use(new PlantsJourney(plantsPages, journeyContext));
  },
  plantsNotificationActions: async ({ plantsPages, pages }, use) => {
    await use(new PlantsNotificationActions(plantsPages, pages));
  },
  notificationApi: async ({ request }, use) => {
    await use(new NotificationApiClient(request));
  },
  addressBookApi: async ({ request }, use) => {
    await use(new AddressBookApiClient(request));
  },
  referenceDataApi: async ({ request }, use) => {
    await use(new ReferenceDataApiClient(request));
  },
  frontendForms: async ({ frontendSeedContext }, use) => {
    await use(new FrontendFormClient(frontendSeedContext));
  },
  openFreshSession: async ({ browser, page, proxy, ignoreHTTPSErrors }, use, testInfo) => {
    const domain = domainOf(testInfo);
    const baseURL = baseUrlForDomain(domain);
    const contexts: BrowserContext[] = [];
    await use(async () => {
      const storageState = stripToAuthCookie(await page.context().storageState(), baseURL, authCookieNameFor(domain, baseURL));
      const context = await browser.newContext({ baseURL, proxy, ignoreHTTPSErrors, storageState });
      contexts.push(context);
      return context.newPage();
    });
    await Promise.all(contexts.map((context) => context.close()));
  },
  submitAnimalsNotificationThenOpenFreshSession: async ({ animalsJourney, journeyContext, openFreshSession }, use) => {
    await use(async () => {
      await animalsJourney.submitNotification();
      const reference = journeyContext.referenceNumber;
      const freshPage = await openFreshSession();
      return { reference, freshPages: createAnimalsPages(freshPage), freshSharedPages: createSharedPages(freshPage) };
    });
  },
  submitPlantsNotificationThenOpenFreshSession: async ({ plantsJourney, addressBookApi, openFreshSession }, use) => {
    await use(async () => {
      const { reference } = await plantsJourney.completeNotification(addressBookApi);
      await plantsJourney.submitFromReview();
      const freshPage = await openFreshSession();
      return { reference, freshPages: createPlantsPages(freshPage), freshSharedPages: createSharedPages(freshPage) };
    });
  },
  externalRequest: async ({ playwright }, use) => {
    const context = await playwright.request.newContext({ proxy: getCdpProxy() });
    await use(context);
    await context.dispose();
  },
  animalsSeededJourney: async ({ frontendForms, addressBookApi, journeyContext }, use) => {
    await use(new AnimalsSeededJourney(frontendForms, addressBookApi, journeyContext));
  },
});

export { expect };
