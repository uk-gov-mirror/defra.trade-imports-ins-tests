import { commoditySpecies } from '@domain/animals/constants/commodity-species';
import { test, expect } from '@fixtures';

const REFERENCE_NUMBER_PATTERN = /GBN-AG-\d{2}-[0-9A-Z]{6}/;
const EXACT_REFERENCE_NUMBER_PATTERN = /^GBN-AG-\d{2}-[0-9A-Z]{6}$/;

test.describe('Notification view states', { tag: '@duplicated-in-frontend' }, () => {
  test.describe('DRAFT', () => {
    test.beforeEach(async ({ animalsSeededJourney, animalsNotificationActions, journeyContext }) => {
      await animalsSeededJourney.createDraftNotification('unlocked');
      await animalsNotificationActions.toNotificationView(journeyContext.referenceNumber);
    });

    test('renders the recorded answers in the numbered design sections', async ({ pages, animalsPages }) => {
      await expect(animalsPages.notificationView.heading).toBeVisible();
      await expect(pages.page.getByRole('heading', { name: '1. About the consignment' })).toBeVisible();
      await expect(pages.page.getByRole('heading', { name: '2. Description of the goods' })).toBeVisible();
      await expect(pages.page.getByRole('heading', { name: '3. Transport and arrival' })).toBeVisible();
      await expect(pages.page.getByRole('heading', { name: '4. Documents' })).toBeVisible();
      await expect(pages.page.getByRole('heading', { name: '5. Consignment parties' })).toBeVisible();
      await expect(pages.page.getByRole('heading', { name: '6. Contact address' })).toBeVisible();
      await expect(animalsPages.notificationView.summaryCard('Uploaded documents')).toBeVisible();
      await expect(animalsPages.notificationView.summaryCard('Uploaded documents')).toContainText('You have not added any documents yet.');
      await expect(animalsPages.notificationView.summaryCard('Import details')).toContainText('France');
      await expect(animalsPages.notificationView.speciesCard(commoditySpecies.cattle)).toContainText('Number of animals');
    });

    test('shows the Draft strip with the notification reference', async ({ animalsPages, journeyContext }) => {
      await expect(animalsPages.notificationView.journeyStrip.locator('.govuk-tag')).toHaveText('Draft');
      await expect(animalsPages.notificationView.journeyStrip).toContainText(journeyContext.referenceNumber);
    });

    test('shows Change links for the recorded answers', async ({ animalsPages }) => {
      await expect(animalsPages.notificationView.changeLink('Change import details')).toBeVisible();
      await expect(animalsPages.notificationView.changeLink('Change commodity 1')).toBeVisible();
    });

    test('offers submission and none of the post-submit actions', async ({ pages, animalsPages }) => {
      await expect(animalsPages.notificationView.continueButton).toBeVisible();
      await expect(pages.page.getByRole('button', { name: 'Copy as new' })).toHaveCount(0);
      await expect(pages.page.getByRole('button', { name: 'Delete' })).toHaveCount(0);
      await expect(animalsPages.notificationView.cancelAmend).toHaveCount(0);
    });

    test('Continue: when the notification is unfinished, stays put and names what is left', async ({ pages, animalsPages }) => {
      await animalsPages.notificationView.continueButton.click();

      await expect(pages.page).toHaveURL(/\/notification-view\?refused=1$/);
      await expect(animalsPages.notificationView.errorSummary).toBeVisible();
      await expect(animalsPages.notificationView.errorSummary).toContainText('There is a problem');
      await expect(animalsPages.notificationView.errorSummary.getByRole('link', { name: 'Complete arrival details' })).toBeVisible();
    });
  });

  test.describe('DRAFT ready to submit', () => {
    test.beforeEach(async ({ animalsSeededJourney, animalsNotificationActions, journeyContext }) => {
      await animalsSeededJourney.createDraftNotification();
      await animalsNotificationActions.toNotificationView(journeyContext.referenceNumber);
    });

    test('shows no error summary once every section is answered', async ({ animalsPages }) => {
      await expect(animalsPages.notificationView.heading).toBeVisible();
      await expect(animalsPages.notificationView.errorSummary).toHaveCount(0);
    });

    test('Continue moves on to the declaration', async ({ pages, animalsPages }) => {
      await animalsPages.notificationView.continueButton.click();
      await expect(pages.page).toHaveURL(/\/declaration$/);
      await expect(animalsPages.declaration.heading).toBeVisible();
    });
  });

  test.describe('SUBMITTED', () => {
    test.beforeEach(async ({ animalsSeededJourney, animalsNotificationActions, journeyContext }) => {
      await animalsSeededJourney.createSubmittedNotification();
      await animalsNotificationActions.toNotificationView(journeyContext.referenceNumber);
    });

    test('lands on the view page with the Submitted strip and reference', async ({ pages, animalsPages, journeyContext }) => {
      await expect(pages.page).toHaveURL(new RegExp(`${animalsPages.notificationView.expectedUrl(journeyContext.referenceNumber)}$`));
      await expect(animalsPages.notificationView.journeyStrip.locator('.govuk-tag')).toHaveText('Submitted');
      await expect(animalsPages.notificationView.journeyStrip).toContainText(journeyContext.referenceNumber);
    });

    test('offers Copy as new and Delete on the read-only view', async ({ pages, animalsPages }) => {
      await expect(pages.page.getByRole('button', { name: 'Copy as new' })).toBeVisible();
      await expect(pages.page.getByRole('button', { name: 'Delete' })).toBeVisible();
      await expect(animalsPages.notificationView.cancelAmend).toHaveCount(0);
    });

    test('copies the submitted notification to a new draft', async ({ animalsPages, journeyContext }) => {
      const originalReferenceNumber = journeyContext.referenceNumber;
      await animalsPages.notificationView.btnCopyAsNew.click();

      await animalsPages.overview.heading.waitFor();
      const copiedReferenceNumber = (await animalsPages.notificationView.referenceNumberCaption.textContent())?.match(
        REFERENCE_NUMBER_PATTERN,
      )?.[0];
      expect(copiedReferenceNumber).toMatch(EXACT_REFERENCE_NUMBER_PATTERN);
      expect(copiedReferenceNumber).not.toEqual(originalReferenceNumber);
    });

    test('still renders the recorded answers after submission', async ({ animalsPages }) => {
      await expect(animalsPages.notificationView.summaryCard('Import details')).toContainText('France');
      await expect(animalsPages.notificationView.speciesCard(commoditySpecies.cattle)).toBeVisible();
    });
  });
});
