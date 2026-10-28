import path from 'node:path';
import { test, expect } from '@fixtures';
import { fileUploadPaths } from '@resources/file-upload/paths';
import { fileUploadTimeouts } from '@config/file-upload-timeouts';
import { writeEicarPdfFile } from '@utils/eicar-file-writer';
import { firstScanStatus } from '@utils/scan-status';

const issueDate = '03/01/2026';

test.describe('Documents scan lifecycle', { tag: '@duplicated-in-frontend' }, () => {
  test.beforeEach(async ({ animalsJourney }) => {
    await animalsJourney.toAccompanyingDocuments();
  });

  test('infected upload: accepted while scanning, then Virus found with error summary blocking Save and continue until it is removed', async ({
    pages,
    animalsPages,
  }, testInfo) => {
    test.slow();
    const eicar = await writeEicarPdfFile(path.join(testInfo.outputDir, 'file-upload'));

    const reference = `PWVIRUS${Date.now()}`;
    await animalsPages.accompanyingDocuments.fillDocument(reference, issueDate, eicar.filePath);
    await animalsPages.accompanyingDocuments.saveAndAddAnother.click();

    const row = animalsPages.accompanyingDocuments.documentRow(reference);
    await firstScanStatus(row, 'Virus found');

    await expect(row).toContainText('Virus found', { timeout: fileUploadTimeouts.virusScanComplete });
    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toBeVisible();
    await expect(
      pages.page.getByText(`${eicar.fileName} cannot be used. Remove it and try again with a different file.`).first(),
    ).toBeVisible();
    await expect(animalsPages.accompanyingDocuments.viewFile(1)).toHaveCount(0);

    await animalsPages.accompanyingDocuments.saveAndContinue.click();
    await expect(
      pages.page.getByText(`${eicar.fileName} cannot be used. Remove it and try again with a different file.`).first(),
    ).toBeVisible();

    await animalsPages.accompanyingDocuments.removeDocument(1).click();
    await animalsPages.accompanyingDocuments.saveAndContinue.click();
    await expect(animalsPages.overview.heading).toBeVisible();
  });

  test('clean upload: Save and continue reaches the overview, and the row settles to Check completed with a view link on reopening', async ({
    animalsPages,
  }) => {
    test.slow();
    const reference = `PWSCAN${Date.now()}`;
    await animalsPages.accompanyingDocuments.fillDocument(reference, issueDate, fileUploadPaths.safeFile1kbPdf);
    await animalsPages.accompanyingDocuments.saveAndAddAnother.click();

    const row = animalsPages.accompanyingDocuments.documentRow(reference);
    const { pending, text } = await firstScanStatus(row, 'Check completed');
    if (pending) {
      expect(text).not.toContain('View file');
    }
    await expect(animalsPages.accompanyingDocuments.removeDocument(1)).toBeVisible();

    await animalsPages.accompanyingDocuments.saveAndContinue.click();
    await expect(animalsPages.overview.heading).toBeVisible();

    await animalsPages.overview.task('Upload documents').click();
    const reopenedRow = animalsPages.accompanyingDocuments.documentRow(reference);
    await expect(reopenedRow).toContainText('Check completed', { timeout: fileUploadTimeouts.virusScanComplete });
    await expect(animalsPages.accompanyingDocuments.viewFile(1)).toBeVisible();
  });
});
