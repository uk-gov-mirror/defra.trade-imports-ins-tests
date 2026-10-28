import { defineConfig } from '@playwright/test';
import sharedConfig from './utils/playwright/shared-config';
import { withContainerHostResolver } from './utils/playwright/with-container-host-resolver';
import { applyDomainBaseUrls } from './utils/playwright/domain-base-urls';
import { withServiceBaseUrls } from './utils/playwright/with-service-base-urls';
import { withZapProxy } from './utils/playwright/with-zap-proxy';

applyDomainBaseUrls(
  {
    animals: 'http://localhost:3000',
    'animals-admin': 'http://localhost:3001',
    ins: 'http://localhost:3002',
    plants: 'http://localhost:3003',
  },
  'docker-compose',
);

const dockerComposeConfig = withServiceBaseUrls(sharedConfig, {
  MONGODB_URI: process.env.MONGODB_URI ?? 'mongodb://localhost:27017',
  TRADE_IMPORTS_ANIMALS_BACKEND_URL: process.env.TRADE_IMPORTS_ANIMALS_BACKEND_URL ?? 'http://localhost:8085',
  TRADE_IMPORTS_ADDRESS_BOOK_URL: process.env.TRADE_IMPORTS_ADDRESS_BOOK_URL ?? 'http://localhost:8089',
  TRADE_IMPORTS_REFERENCE_DATA_URL: process.env.TRADE_IMPORTS_REFERENCE_DATA_URL ?? 'http://localhost:8086',
  AWS_SQS_ENDPOINT: process.env.AWS_SQS_ENDPOINT ?? 'http://localhost:4566',
  NOTIFICATION_SQS_DLQ_URL:
    process.env.NOTIFICATION_SQS_DLQ_URL ??
    'http://localhost:4566/000000000000/trade_imports_animals_eu_notifications_gateway-deadletter.fifo',
});

/**
 * e2e against the workspace docker-compose stack (local dev, CI, and containerised runs).
 * In-container runs (PLAYWRIGHT_IN_CONTAINER=1) add a Chromium host-resolver rule for OIDC localhost redirects.
 * PROFILE=security or security:active routes traffic through ZAP's proxy.
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig(
  withZapProxy(process.env.PLAYWRIGHT_IN_CONTAINER === '1' ? withContainerHostResolver(dockerComposeConfig) : dockerComposeConfig),
);
