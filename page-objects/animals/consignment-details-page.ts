import { type Locator } from '@playwright/test';
import { type CommoditySpecies } from '@domain/animals/constants/commodity-species';
import { NotificationPage } from '@page-objects/shared/base-page';
import { SelectedCommoditiesTable } from '@page-objects/animals/selected-commodities-table';

export class AnimalsConsignmentDetailsPage extends NotificationPage {
  readonly selectedCommodities = new SelectedCommoditiesTable(this.page);

  constructor(page: ConstructorParameters<typeof NotificationPage>[0]) {
    super(page, 'consignment-details');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Commodity details' });
  }

  get numberOfAnimals(): Locator {
    return this.page.getByLabel('Number of animals');
  }

  get numberOfPackages(): Locator {
    return this.page.getByLabel('Number of packages (when required)');
  }

  get addAnotherCommodity(): Locator {
    return this.page.getByRole('link', { name: 'Add another commodity' });
  }

  get errorSummary(): Locator {
    return this.page.getByRole('heading', { level: 2, name: 'There is a problem' });
  }

  get animalsRequiredErrorLink(): Locator {
    return this.page.getByRole('link', { name: 'Enter the number of animals' });
  }

  get caption(): Locator {
    return this.page.getByText('Description of the goods', { exact: true });
  }

  get headingBelowCaption(): Locator {
    return this.caption.locator('xpath=following-sibling::*[1]');
  }

  async numberOfAnimalsFor(species: CommoditySpecies): Promise<Locator> {
    return this.numberOfAnimals.nth(await this.speciesPosition(species));
  }

  async numberOfPackagesFor(species: CommoditySpecies): Promise<Locator> {
    return this.numberOfPackages.nth(await this.speciesPosition(species));
  }

  async fillAnimalCountFor(species: CommoditySpecies, count: number): Promise<void> {
    await (await this.numberOfAnimalsFor(species)).fill(String(count));
  }

  async fillPackageCountFor(species: CommoditySpecies, count: number): Promise<void> {
    await (await this.numberOfPackagesFor(species)).fill(String(count));
  }

  private async speciesPosition(species: CommoditySpecies): Promise<number> {
    const speciesHeadings = await this.page.getByRole('heading', { level: 3 }).allTextContents();
    const index = speciesHeadings.indexOf(species.latinName);
    if (index === -1) {
      throw new Error(`No "${species.latinName}" heading among: ${speciesHeadings.join(', ')}`);
    }
    return index;
  }

  async fillEveryAnimalCount(count: string): Promise<void> {
    for (const box of await this.numberOfAnimals.all()) {
      await box.fill(count);
    }
  }

  async fillEveryPackageCount(count: string): Promise<void> {
    for (const box of await this.numberOfPackages.all()) {
      await box.fill(count);
    }
  }
}
