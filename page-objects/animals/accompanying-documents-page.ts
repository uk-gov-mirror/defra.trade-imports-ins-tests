import type { Locator, Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/shared/base-page';
import { DatePicker } from '@page-objects/shared/date-picker';

export const EMPTY_DOCUMENT_LIST_CARD_TEXT = /Save and add another\s*$/;

export class AnimalsAccompanyingDocumentsPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'accompanying-documents');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Upload documents' });
  }

  get documentReference(): Locator {
    return this.page.getByLabel('Document reference');
  }

  get documentType(): Locator {
    return this.page.getByLabel('Document type');
  }

  get fileUpload(): Locator {
    return this.page.locator('input[type="file"]');
  }

  get dateOfIssuePicker(): DatePicker {
    return new DatePicker(this.page, 'accompanyingDocumentDateOfIssue');
  }

  get dateOfIssue(): Locator {
    return this.page.locator('input[name="accompanyingDocumentDateOfIssue"]');
  }

  get saveAndAddAnother(): Locator {
    return this.page.getByRole('button', { name: 'Save and add another' });
  }

  get continueButton(): Locator {
    return this.page.getByRole('button', { name: 'Continue' });
  }

  get fileUploadCard(): Locator {
    return this.page.getByRole('region', { name: 'File upload' });
  }

  get addedDocumentsTable(): Locator {
    return this.fileUploadCard.getByRole('table', { name: 'Documents you have added' });
  }

  get addedDocumentRows(): Locator {
    return this.addedDocumentsTable.locator('tbody tr');
  }

  documentRow(reference: string): Locator {
    return this.page.locator('.govuk-table__row', { hasText: reference });
  }

  removeDocument(index: number): Locator {
    return this.page.getByRole('button', { name: `Remove document ${index}`, exact: true });
  }

  viewFile(index: number): Locator {
    return this.page.getByRole('link', { name: `View file for document ${index}` });
  }

  get errorSummary(): Locator {
    return this.page.locator('.govuk-error-summary');
  }

  get fileFieldError(): Locator {
    return this.page.locator('.govuk-error-message');
  }

  // The reason the add control is shut, which the control names through
  // aria-describedby. Distinct from fileFieldError: this one is about the
  // notification being full or the upload service being unreachable, not
  // about the file in the input.
  get addDocumentError(): Locator {
    return this.page.locator('#add-document-error');
  }

  get refreshStatus(): Locator {
    return this.page.getByRole('link', { name: /Refresh/ });
  }

  async fillDocument(reference: string, issueDate: string, filePath: string, documentType: string = 'ITAHC'): Promise<void> {
    await this.documentReference.fill(reference);
    await this.documentType.selectOption(documentType);
    await this.dateOfIssue.fill(issueDate);
    await this.fileUpload.setInputFiles(filePath);
  }
}
