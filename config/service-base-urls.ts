import { isCdpLocal } from '@utils/playwright/environment';

const getServiceBaseUrl = (envVar: string): string => {
  const baseUrl = process.env[envVar];
  if (!baseUrl) {
    throw new Error(`${envVar} is not set. Ensure Playwright config applies it before running tests.`);
  }
  return baseUrl;
};

export const getAnimalsFrontendBaseUrl = (): string => getServiceBaseUrl('TRADE_IMPORTS_ANIMALS_FRONTEND_BASE_URL');

export const getBackendBaseUrl = (): string => getServiceBaseUrl('TRADE_IMPORTS_ANIMALS_BACKEND_URL');

export const getAddressBookBaseUrl = (): string => getServiceBaseUrl('TRADE_IMPORTS_ADDRESS_BOOK_URL');

export const getReferenceDataBaseUrl = (): string => getServiceBaseUrl('TRADE_IMPORTS_REFERENCE_DATA_URL');

export const getMongoDbUri = (): string => getServiceBaseUrl('MONGODB_URI');

export const getSqsEndpoint = (): string => getServiceBaseUrl('AWS_SQS_ENDPOINT');

export const getDlqUrl = (): string => getServiceBaseUrl('NOTIFICATION_SQS_DLQ_URL');

export const getDeveloperApiKey = (): string | undefined => {
  const apiKey = process.env.DEVELOPER_API_KEY;
  if (isCdpLocal() && !apiKey) {
    throw new Error('DEVELOPER_API_KEY is not set. Required when CDP_LOCAL=true.');
  }
  return apiKey || undefined;
};
