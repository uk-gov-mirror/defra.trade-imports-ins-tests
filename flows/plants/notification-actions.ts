import { pageLoadWait, timeouts } from '@config/timeouts';
import type { PlantsPages, SharedPages } from '@page-objects';
import { PLANTS_FOR_PLANTING, type PlantsJourney } from '@flows/plants/journey';
import type { AddressBookApiClient } from '@adapters/http/address-book-api-client';

export class PlantsNotificationActions {
  constructor(
    private readonly plantsPages: PlantsPages,
    private readonly pages: SharedPages,
  ) {}

  async toNotificationView(referenceNumber: string): Promise<void> {
    await this.plantsPages.notificationView.open(referenceNumber);
  }

  async amendNotification(referenceNumber: string): Promise<void> {
    await this.plantsPages.dashboard.open();
    await this.plantsPages.dashboard.searchForReference(referenceNumber);
    await this.plantsPages.dashboard.amend(referenceNumber).click();
    await this.plantsPages.overview.heading.waitFor(pageLoadWait);
  }

  async amendCompletedNotification(
    plantsJourney: PlantsJourney,
    addressBookApi: AddressBookApiClient,
    options: { type?: string; days?: number } = {},
  ): Promise<string> {
    const { reference } = await plantsJourney.completeNotification(addressBookApi, options);
    await plantsJourney.submitFromReview();
    await this.amendNotification(reference);
    return reference;
  }

  async amendCompletedPlantsForPlanting(plantsJourney: PlantsJourney, addressBookApi: AddressBookApiClient): Promise<string> {
    return this.amendCompletedNotification(plantsJourney, addressBookApi, { type: PLANTS_FOR_PLANTING, days: -1 });
  }

  /**
   * Discards an in-progress amendment, restoring the submitted version. Waits on
   * `?cancelled=1` rather than the view's heading, which the error page also has.
   */
  async cancelAmend(referenceNumber: string): Promise<void> {
    await this.toNotificationView(referenceNumber);
    await this.plantsPages.notificationView.cancelAmend.click();
    await this.plantsPages.notificationCancelAmend.heading.waitFor(pageLoadWait);
    await this.plantsPages.notificationCancelAmend.confirm.click();
    await this.pages.page.waitForURL(/\/notification-view\?cancelled=1$/, { timeout: timeouts.medium });
  }

  async deleteNotification(referenceNumber: string): Promise<void> {
    await this.toNotificationView(referenceNumber);
    await this.plantsPages.notificationView.btnDelete.click();
    await this.plantsPages.deleteNotification.heading.waitFor(pageLoadWait);
    await this.plantsPages.deleteNotification.confirmDelete.click();
    await this.plantsPages.dashboard.deletedBanner.waitFor(pageLoadWait);
  }
}
