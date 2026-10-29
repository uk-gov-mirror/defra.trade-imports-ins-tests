import type { APIRequestContext } from '@playwright/test';
import { RestClient } from '@adapters/http/rest-client';
import { getDeveloperApiKey, getReferenceDataBaseUrl } from '@config/service-base-urls';
import type { CommoditySpecies } from '@domain/animals/constants/commodity-species';

interface ListedSpecies {
  latinName: string;
  commonName: string | null;
}

interface CommodityGroup {
  code: string;
  species: ListedSpecies[];
}

interface CommoditySearchResponse {
  groups: CommodityGroup[];
}

/** Direct HTTP access to reference-data's commodity search. */
export class ReferenceDataApiClient {
  private readonly rest: RestClient;

  constructor(request: APIRequestContext, baseUrl: string = getReferenceDataBaseUrl(), apiKey: string | undefined = getDeveloperApiKey()) {
    this.rest = new RestClient(baseUrl, request, apiKey);
  }

  /** The common name the species' own search gives it. Throws when the search does not list the species or gives it no common name. */
  async findCommonName(species: CommoditySpecies): Promise<string> {
    const { commonName } = await this.findSpecies(species);
    if (!commonName) {
      throw new Error(`Searching "${species.searchTerm}" gives ${species.latinName} under ${species.commodityCode} no common name`);
    }
    return commonName;
  }

  /** The commodity groups, each with its species in order, on the first page of results for the search term. */
  async listGroups(searchTerm: string): Promise<CommodityGroup[]> {
    const firstPageSize = 100;
    const query = encodeURIComponent(searchTerm);
    const response = await this.rest.get<CommoditySearchResponse>(`/commodities?q=${query}&size=${firstPageSize}`);
    return response.groups;
  }

  private async findSpecies(species: CommoditySpecies): Promise<ListedSpecies> {
    const groups = await this.listGroups(species.searchTerm);
    const listed = groups
      .find((group) => group.code === species.commodityCode)
      ?.species.find((candidate) => candidate.latinName === species.latinName);
    if (!listed) {
      throw new Error(`Searching "${species.searchTerm}" does not list ${species.latinName} under ${species.commodityCode}`);
    }
    return listed;
  }
}
