import type { APIRequestContext } from '@playwright/test';
import { RestClient } from '@adapters/http/rest-client';
import { getDeveloperApiKey, getReferenceDataBaseUrl } from '@config/service-base-urls';
import type { CommodityLine } from '@domain/animals/constants/commodity-lines';

interface CommoditySpecies {
  latinName: string;
  commonName: string | null;
}

interface CommodityGroup {
  code: string;
  species: CommoditySpecies[];
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

  /** The common name the line's own search gives its species. Throws when the search does not list the species or gives it no common name. */
  async findCommonName(line: CommodityLine): Promise<string> {
    const { commonName } = await this.findSpecies(line);
    if (!commonName) {
      throw new Error(`Searching "${line.searchTerm}" gives ${line.latinName} under ${line.commodityCode} no common name`);
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

  private async findSpecies(line: CommodityLine): Promise<CommoditySpecies> {
    const groups = await this.listGroups(line.searchTerm);
    const species = groups
      .find((group) => group.code === line.commodityCode)
      ?.species.find((candidate) => candidate.latinName === line.latinName);
    if (!species) {
      throw new Error(`Searching "${line.searchTerm}" does not list ${line.latinName} under ${line.commodityCode}`);
    }
    return species;
  }
}
