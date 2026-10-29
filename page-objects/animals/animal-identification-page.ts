import { type Locator, type Page } from '@playwright/test';
import { type CommoditySpecies } from '@domain/animals/constants/commodity-species';
import { type PermanentAddressAnswer } from '@domain/animals/constants/journey-commodity-line-answers';
import { NotificationPage } from '@page-objects/shared/base-page';
import { SelectedCommoditiesTable } from '@page-objects/animals/selected-commodities-table';

export class AnimalsAnimalIdentificationPage extends NotificationPage {
  readonly selectedCommodities = new SelectedCommoditiesTable(this.page);

  constructor(page: Page) {
    super(page, 'commodities/identification');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Identification details' });
  }

  get earTag(): Locator {
    return this.page.getByLabel('Ear tag', { exact: true });
  }

  get passportNumber(): Locator {
    return this.page.getByLabel('Passport', { exact: true });
  }

  get microchip(): Locator {
    return this.page.getByLabel('Microchip', { exact: true });
  }

  get horseName(): Locator {
    return this.page.getByLabel('Horse name', { exact: true });
  }

  enterDetailsCounterHeading(species: CommoditySpecies, current: number, total: number): Locator {
    return this.page.getByRole('heading', {
      name: `Enter details for ${species.latinName} ${current} of ${total}`,
      exact: true,
    });
  }

  get permanentAddressName(): Locator {
    return this.page.getByLabel('Name or organisation name', { exact: true });
  }

  async fillPermanentAddress(address: PermanentAddressAnswer, scope: Page | Locator = this.page): Promise<void> {
    const field = (label: string): Locator => scope.getByLabel(label, { exact: true });
    await field('Name or organisation name').fill(address.nameOrOrganisationName);
    await field('Address line 1').fill(address.addressLine1);
    if (address.addressLine2) {
      await field('Address line 2 (optional)').fill(address.addressLine2);
    }
    await field('Town or city').fill(address.townOrCity);
    if (address.county) {
      await field('County (optional)').fill(address.county);
    }
    await field('Postcode or Zip code').fill(address.postcode);
    await field('Phone number').fill(address.phone);
    await field('Email address').fill(address.email);
  }

  commodityHeading(heading: string): Locator {
    return this.page.getByRole('heading', { level: 2, name: heading, exact: true });
  }

  speciesCard(species: CommoditySpecies): Locator {
    return this.page.getByRole('region', { name: species.latinName, exact: true });
  }

  savedAnimalsRows(species: CommoditySpecies): Locator {
    return this.speciesCard(species).getByRole('table').locator('tbody').getByRole('row');
  }

  savedAnimalRow(species: CommoditySpecies, number: number): Locator {
    return this.speciesCard(species)
      .getByRole('row')
      .filter({ has: this.page.getByRole('cell', { name: `${species.latinName} ${number}`, exact: true }) });
  }

  identifierColumn(name: string): Locator {
    return this.page.getByRole('columnheader', { name, exact: true });
  }

  get saveAndAddAnother(): Locator {
    return this.page.getByRole('button', { name: 'Save and add another' });
  }

  get saveAndFinish(): Locator {
    return this.page.getByRole('button', { name: 'Save and finish' });
  }
}
