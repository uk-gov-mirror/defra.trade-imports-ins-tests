import type { APIRequestContext } from '@playwright/test';
import { RestClient } from '@adapters/http/rest-client';
import { E2E_ORGANISATION_ID, organisationHeaders, type TraderApiClientOptions } from '@adapters/http/organisation';
import { getDeveloperApiKey, getInsBackendBaseUrl } from '@config/service-base-urls';

interface AggregatedNotificationPage {
  totalElements: number;
}

/** Direct HTTP access to the INS aggregated notification list (read model). */
export class InsAggregatedNotificationsApiClient {
  private readonly rest: RestClient;
  private readonly organisationId: string;

  constructor(request: APIRequestContext, options: TraderApiClientOptions = {}) {
    const { baseUrl = getInsBackendBaseUrl(), apiKey = getDeveloperApiKey(), organisationId = E2E_ORGANISATION_ID } = options;
    this.organisationId = organisationId;
    this.rest = new RestClient(baseUrl, request, apiKey);
  }

  async countByReference(referenceNumber: string): Promise<number> {
    const path = `/notifications?referenceNumber=${encodeURIComponent(referenceNumber)}&page=1`;
    const page = await this.rest.get<AggregatedNotificationPage>(path, organisationHeaders(this.organisationId));
    return page.totalElements;
  }
}
