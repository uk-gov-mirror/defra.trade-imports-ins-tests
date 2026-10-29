import { type Locator, type Page } from '@playwright/test';
import { pageLoadWait } from '@config/timeouts';
import { type CommoditySpecies } from '@domain/animals/constants/commodity-species';
import { NotificationPage, type OpenOptions } from '@page-objects/shared/base-page';

export class AnimalsNotificationViewPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'notification-view');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Review your notification' });
  }

  get referenceNumberCaption(): Locator {
    return this.journeyStrip;
  }

  get btnCopyAsNew(): Locator {
    return this.page.getByRole('button', { name: 'Copy as new' });
  }

  get btnDelete(): Locator {
    return this.page.getByRole('button', { name: 'Delete' });
  }

  get continueButton(): Locator {
    return this.page.getByRole('button', { name: 'Continue' });
  }

  changeLink(name: string | RegExp): Locator {
    return this.page.getByRole('link', { name });
  }

  summaryCard(name: string): Locator {
    return this.page.locator('.govuk-summary-card', { hasText: name });
  }

  speciesCard(species: CommoditySpecies): Locator {
    return this.summaryCard(`${species.commodityCode} — ${species.latinName}`);
  }

  summaryValue(card: Locator, key: string): Locator {
    return card
      .locator('.govuk-summary-list__row', { has: this.page.getByText(key, { exact: true }) })
      .locator('.govuk-summary-list__value');
  }

  get regionOfOriginCode(): Locator {
    return this.summaryValue(this.summaryCard('Import details'), 'Region of origin code');
  }

  get errorSummary(): Locator {
    return this.page.locator('.govuk-error-summary');
  }

  partyRow(card: string, role: string): Locator {
    return this.summaryCard(card)
      .locator('.govuk-summary-list__row')
      .filter({ has: this.page.getByRole('term').and(this.page.getByText(role, { exact: true })) });
  }

  editPartyDetails(card: string, role: string): Locator {
    return this.partyRow(card, role).getByRole('link', { name: 'Edit details' });
  }

  partyError(card: string, role: string): Locator {
    return this.partyRow(card, role).getByRole('definition').first();
  }

  async open(referenceNumber: string, { attemptSignIn = true, ...identity }: OpenOptions = {}): Promise<void> {
    await super.open(referenceNumber, { attemptSignIn, ...identity });
    if (attemptSignIn) await this.heading.waitFor(pageLoadWait);
  }
}
