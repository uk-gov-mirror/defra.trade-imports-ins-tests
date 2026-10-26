import { type Locator } from '@playwright/test';
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

  async fillAnimalCountFor(species: string, count: number): Promise<void> {
    const speciesHeadings = await this.page.getByRole('heading', { level: 3 }).allTextContents();
    const index = speciesHeadings.indexOf(species);
    if (index === -1) {
      throw new Error(`No "${species}" heading among: ${speciesHeadings.join(', ')}`);
    }
    await this.numberOfAnimals.nth(index).fill(String(count));
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
