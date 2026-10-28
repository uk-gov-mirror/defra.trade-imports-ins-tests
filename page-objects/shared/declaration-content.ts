import type { Locator, Page } from '@playwright/test';

const CONFIRMATION_LEGEND = 'Declaration confirmation';

export class DeclarationContent {
  constructor(private readonly page: Page) {}

  get confirmationGroup(): Locator {
    return this.page.getByRole('group', { name: CONFIRMATION_LEGEND, exact: true });
  }

  get confirmationCheckbox(): Locator {
    return this.confirmationGroup.getByRole('checkbox', { name: /I confirm that I have reviewed/ });
  }

  get dateValue(): Locator {
    return this.page.getByRole('paragraph').filter({ hasText: 'Date of declaration:' }).getByRole('strong');
  }

  get firstContentElement(): Locator {
    return this.page.locator('main .govuk-grid-column-two-thirds > :first-child');
  }
}
