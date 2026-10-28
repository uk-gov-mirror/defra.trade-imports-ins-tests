import { defineConfig } from '@playwright/test';
import sharedConfig from './utils/playwright/shared-config';
import { getEnvironment } from './utils/playwright/environment';
import { applyDomainBaseUrls } from './utils/playwright/domain-base-urls';
import { withServiceBaseUrls } from './utils/playwright/with-service-base-urls';
import { cdpServiceUrl } from './utils/playwright/cdp-service-url';
import { withZapProxy } from './utils/playwright/with-zap-proxy';
import { sessionReuseEnabled } from './utils/playwright/session-reuse';

const environment = getEnvironment();

applyDomainBaseUrls(
  {
    animals: `https://trade-imports-animals-frontend.${environment}.cdp-int.defra.cloud`,
    'animals-admin': `https://trade-imports-animals-admin.${environment}.cdp-int.defra.cloud`,
    ins: `https://trade-imports-ins-frontend.${environment}.cdp-int.defra.cloud`,
    plants: `https://trade-imports-plants-frontend.${environment}.cdp-int.defra.cloud`,
  },
  'cdp',
);

const cdpConfig = withServiceBaseUrls(sharedConfig, {
  TRADE_IMPORTS_ANIMALS_BACKEND_URL: cdpServiceUrl('trade-imports-animals-backend', environment),
  TRADE_IMPORTS_ADDRESS_BOOK_URL: cdpServiceUrl('trade-imports-address-book', environment),
  TRADE_IMPORTS_REFERENCE_DATA_URL: cdpServiceUrl('trade-imports-reference-data', environment),
});

const CDP_TEST_TIMEOUT_MS = 60_000;
const CDP_EXPECT_TIMEOUT_MS = 15_000;
const CDP_WORKERS_WITHOUT_SESSION_REUSE = 4;

/**
 * Base config: e2e against the deployed CDP environment.
 * PROFILE=security or security:active routes traffic through ZAP's proxy.
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig(
  withZapProxy({
    ...cdpConfig,
    ...(sessionReuseEnabled() ? {} : { workers: CDP_WORKERS_WITHOUT_SESSION_REUSE }),
    timeout: CDP_TEST_TIMEOUT_MS,
    expect: { timeout: CDP_EXPECT_TIMEOUT_MS },
  }),
);
