import { SET_BASES } from '@page-objects/shared/sets';
import { randomUUID } from 'node:crypto';
import { test, expect } from '@fixtures';
import { POTATOES, PLANTS_FOR_PLANTING, WOOD_AND_CUT_TREES, potatoLine, arrivalDate } from '@flows/plants/journey';
import type { PlantsPages, SharedPages } from '@page-objects';
import { todayOrTomorrowServiceDisplayDatePattern } from '@utils/date-utils';

async function expectReview(plantsPages: PlantsPages) {
  await expect(plantsPages.notificationView.heading).toBeVisible();
}

async function assertReadOnly(plantsPages: PlantsPages) {
  await expect(plantsPages.notificationView.heading).toBeVisible();
  await expect(plantsPages.overview.statusTag).toHaveText('Submitted');
  await expect(plantsPages.notificationView.changeLinks).toHaveCount(0);
  await expect(plantsPages.notificationView.btnContinue).toHaveCount(0);
}

async function expectAmending(pages: SharedPages, plantsPages: PlantsPages, reference: string) {
  await expect(pages.page).toHaveURL(plantsPages.overview.expectedUrl(reference));
  await expect(plantsPages.overview.statusTag).toHaveText('Amend');
  await expect(plantsPages.overview.cancelAmend).toBeVisible();
}

test.describe('High-risk plants check and submit section', () => {
  test('review stays blocked until the final required row is complete', async ({ pages, plantsPages, plantsJourney, addressBookApi }) => {
    const { reference, address } = await plantsJourney.completeNotification(addressBookApi, { contact: false });
    const contactEntry = plantsPages.notificationView.errorSummary.getByRole('link', { name: 'Complete contact', exact: true });
    await expect(contactEntry).toHaveAttribute('href', '#contact');
    await plantsPages.notificationView.btnContinue.click();
    await expect(pages.page).toHaveURL(plantsPages.notificationView.expectedUrl(reference));
    await expect(contactEntry).toBeVisible();
    await plantsPages.overview.open(reference);
    const review = plantsPages.overview.taskRowByTitle('Check and submit');
    await expect(review).toContainText('Cannot start yet');
    await expect(review.getByRole('link')).toHaveCount(0);
    await plantsPages.consignmentContactSelect.open(reference);
    await plantsPages.consignmentContactSelect.searchFor(address.name);
    await plantsPages.consignmentContactSelect.address(address.name).check();
    await plantsPages.consignmentContactSelect.saveAndContinue.click();
    await expect(pages.page).toHaveURL(plantsPages.overview.expectedUrl(reference));
    await plantsPages.overview.taskRowLink('Check and submit').click();
    await expectReview(plantsPages);
  });

  test('CYA renders numbered sections, scoped cards and contact details, and Change returns to saved answers', async ({
    pages,
    plantsPages,
    plantsJourney,
    addressBookApi,
  }) => {
    const { address } = await plantsJourney.completeNotification(addressBookApi);
    await expectReview(plantsPages);
    await expect(pages.page.getByRole('heading', { level: 2, name: /^[1-3]\. / })).toHaveText([
      '1. About the consignment',
      '2. Arrival and destination',
      '3. Consignment parties',
    ]);
    await expect(plantsPages.notificationView.card('Consignor')).toHaveCount(0);
    const contact = plantsPages.notificationView.card('Contact');
    await expect(contact).toContainText(address.name);
    await expect(contact).toContainText('4 Nursery Lane, Perth, Perthshire, PH1 5EX');
    await expect(contact).toContainText('01738 555 0143');
    await expect(contact).toContainText('review@example.co.uk');
    await plantsPages.notificationView.change('Change country of origin (Import details)').click();
    await expect(pages.page).toHaveURL(/\/origin\?change=1$/);
    await plantsPages.origin.country.choose('Germany');
    await plantsPages.origin.saveAndContinue.click();
    await expect(plantsPages.notificationView.heading).toBeVisible();
    await expect(plantsPages.notificationView.card('Import details')).toContainText('Germany');
    await plantsPages.notificationView.change('Change Commodity 1 (Commodity 1)').click();
    await plantsPages.commodityDetails.field('Quantity').fill('300');
    await plantsPages.commodityDetails.saveAndContinue.click();
    await plantsPages.commodities.saveAndContinue.click();
    await expect(plantsPages.notificationView.heading).toBeVisible();
    await pages.page.reload();
    await expect(plantsPages.notificationView.card('Commodity 1')).toContainText('300');
  });

  test('declaration is required and submission produces a read-only notification and Submitted dashboard card', async ({
    pages,
    plantsPages,
    plantsJourney,
    addressBookApi,
  }) => {
    const { reference } = await plantsJourney.completeNotification(addressBookApi);
    await expectReview(plantsPages);
    await plantsPages.notificationView.btnContinue.click();
    await expect(pages.page).toHaveURL(plantsPages.declaration.expectedUrl(reference));
    await plantsPages.declaration.btnContinue.click();
    await expect(plantsPages.declaration.errorSummary).toContainText('Confirm that the information is true and correct before submitting');
    await expect(pages.page).toHaveURL(plantsPages.declaration.expectedUrl(reference));
    await plantsPages.declaration.linkBack.click();
    await expect(plantsPages.notificationView.heading).toBeVisible();
    await plantsJourney.submitFromReview();
    await expect(pages.page).toHaveURL(plantsPages.confirmation.expectedUrl(reference));
    await expect(plantsPages.confirmation.panel).toContainText(reference);
    await expect(plantsPages.overview.statusTag).toHaveText('Submitted');
    await expect(plantsPages.confirmation.notificationDate).toBeVisible();
    await expect(plantsPages.confirmation.content).toContainText(
      new RegExp(`Date of notification[^0-9]{0,20}${todayOrTomorrowServiceDisplayDatePattern()}`),
    );
    await expect(plantsPages.confirmation.lateBanner).toHaveCount(0);
    await plantsPages.confirmation.viewNotification.click();
    await assertReadOnly(plantsPages);
    await expect(plantsPages.notificationView.lateBanner).toHaveCount(0);
    await plantsPages.dashboard.open();
    await plantsPages.dashboard.searchForReference(reference);
    await expect(plantsPages.dashboard.notificationCard(reference).getByText('Submitted', { exact: true })).toBeVisible();
  });

  test.describe('declaration of a draft', () => {
    let reference: string;

    test.beforeEach(async ({ plantsJourney, addressBookApi }) => {
      ({ reference } = await plantsJourney.completeNotification(addressBookApi));
      await plantsJourney.toDeclarationFromReview();
    });

    test('puts the confirmation checkbox in a group named by the declaration legend', async ({ plantsPages }) => {
      await expect(plantsPages.declaration.content.confirmationGroup).toBeVisible();
      await expect(plantsPages.declaration.content.confirmationCheckbox).toBeVisible();
    });

    test('shows the date of declaration as the strong text of its line', async ({ plantsPages }) => {
      await expect(plantsPages.declaration.content.dateValue).toHaveText(new RegExp(`^${todayOrTomorrowServiceDisplayDatePattern()}$`));
    });

    test('starts the declaration of a draft with the Declaration heading', async ({ plantsPages }) => {
      await expect(plantsPages.declaration.content.firstContentElement).toHaveText('Declaration');
    });

    test('submits to the confirmation page once confirmed', async ({ pages, plantsPages }) => {
      await plantsPages.declaration.checkbox.check();
      await plantsPages.declaration.btnContinue.click();

      await expect(pages.page).toHaveURL(plantsPages.confirmation.expectedUrl(reference));
    });
  });

  test('starts the declaration of an amendment with the Declaration heading', async ({
    plantsPages,
    plantsJourney,
    plantsNotificationActions,
    addressBookApi,
  }) => {
    const reference = await plantsNotificationActions.amendCompletedNotification(plantsJourney, addressBookApi);
    await plantsJourney.toDeclarationOf(reference);

    await expect(plantsPages.declaration.content.firstContentElement).toHaveText('Declaration');
  });

  for (const { type, days, rule } of [
    { type: POTATOES, days: 0, rule: 'Notifications for potatoes must be made at least 2 days before the expected date of arrival.' },
    {
      type: PLANTS_FOR_PLANTING,
      days: -7,
      rule: 'Notifications for plants for planting and wood must be made no later than 4 days after the date of arrival.',
    },
  ]) {
    test(`${type}: late notifications are accepted and highlighted`, async ({ pages, plantsPages, plantsJourney, addressBookApi }) => {
      const { reference } = await plantsJourney.completeNotification(addressBookApi, { type, days });
      await expectReview(plantsPages);
      await expect(
        pages.page.getByText(`If you submit this notification today it will be late. ${rule} You can still submit it.`, { exact: false }),
      ).toBeVisible();
      await plantsJourney.submitFromReview();
      await expect(plantsPages.confirmation.panel).toContainText(reference);
      await expect(plantsPages.confirmation.lateBanner).toBeVisible();
      await expect(pages.page.getByText(rule, { exact: false })).toBeVisible();
      await plantsPages.confirmation.viewNotification.click();
      await assertReadOnly(plantsPages);
      await expect(plantsPages.notificationView.lateBanner).toBeVisible();
      await plantsPages.dashboard.open();
      await plantsPages.dashboard.searchForReference(reference);
      await expect(plantsPages.dashboard.notificationCard(reference).getByText('Submitted', { exact: true })).toBeVisible();
    });
  }

  test('a saved French origin becomes invalid when a ware-potato line is added and prevents submission', async ({
    pages,
    plantsPages,
    plantsJourney,
    addressBookApi,
  }) => {
    const { reference } = await plantsJourney.completeNotification(addressBookApi);
    await plantsPages.commodities.open(reference);
    await plantsJourney.addAnotherCommodityLine('Ware potatoes', { ...potatoLine, 'Intended use': 'Consumption' });
    await plantsPages.notificationView.open(reference);
    await expect(plantsPages.notificationView.card('Import details')).toContainText('France');
    await plantsPages.notificationView.btnContinue.click();
    await expect(pages.page).toHaveURL(plantsPages.notificationView.expectedUrl(reference));
    const correction = plantsPages.notificationView.errorSummary.getByRole('link', { name: /Poland/ });
    await expect(correction).toHaveAttribute('href', `${SET_BASES.highRiskPlants}/notifications/${reference}/origin?change=1`);
    await expect(plantsPages.overview.statusTag).toHaveText('Draft');
    await correction.click();
    await expect(pages.page).toHaveURL(/\/origin\?change=1$/);
  });

  test('a destination deleted from the address book keeps its copy on CYA and submits', async ({
    pages,
    plantsPages,
    plantsJourney,
    addressBookApi,
  }) => {
    const { reference, address } = await plantsJourney.completeNotification(addressBookApi);
    await expectReview(plantsPages);
    await addressBookApi.deleteAddress(address.id);
    await pages.page.reload();
    const destination = plantsPages.notificationView.card('Place of destination');
    await expect(destination).toContainText(address.name);
    await expect(destination).toContainText('PH1 5EX');
    await plantsJourney.submitFromReview();
    await expect(pages.page).toHaveURL(plantsPages.confirmation.expectedUrl(reference));

    await plantsPages.confirmation.viewNotification.click();
    await assertReadOnly(plantsPages);
    await expect(destination).toContainText(address.name);
    await expect(destination).toContainText('PH1 5EX');
  });

  test(
    'editing the record in the address book does not change what the notification shows',
    { tag: '@address-book' },
    async ({ plantsPages, plantsJourney, addressBookApi }) => {
      const { reference, address } = await plantsJourney.completeNotification(addressBookApi);
      const originalName = address.name;
      const renamed = `Renamed Holding ${randomUUID()}`;

      await addressBookApi.updateAddress(address.id, {
        name: renamed,
        addressLine1: '4 Nursery Lane',
        townOrCity: 'Dundee',
        postcode: 'DD1 1AA',
        countryCode: 'GB',
        phone: '01738 555 0143',
        email: 'review@example.co.uk',
      });

      await plantsPages.placeOfDestination.open(reference);
      await expect(plantsPages.placeOfDestination.currentAddress).toContainText(originalName);
      await expect(plantsPages.placeOfDestination.currentAddress).not.toContainText(renamed);

      await plantsPages.notificationView.open(reference);
      const destination = plantsPages.notificationView.card('Place of destination');
      await expect(destination).toContainText(originalName);
      await expect(destination).toContainText('Perth');
      await expect(destination).toContainText('PH1 5EX');
      await expect(destination).not.toContainText(renamed);
      await expect(destination).not.toContainText('Dundee');
    },
  );

  for (const source of ['dashboard', 'CYA', 'question page']) {
    test(`cancel amendment from ${source} restores submitted answers and read-only CYA`, async ({
      pages,
      plantsPages,
      plantsJourney,
      plantsNotificationActions,
      addressBookApi,
    }) => {
      const { reference } = await plantsJourney.completeNotification(addressBookApi);
      await expectReview(plantsPages);
      await plantsJourney.submitFromReview();
      await plantsNotificationActions.amendNotification(reference);
      await expectAmending(pages, plantsPages, reference);
      await plantsPages.identificationNumbers.open(reference);
      await plantsPages.identificationNumbers.producer.fill('DiscardMe99');
      await plantsPages.identificationNumbers.saveAndContinue.click();
      await plantsPages.dashboard.open();
      await plantsPages.dashboard.searchForReference(reference);
      await expect(plantsPages.dashboard.statusTag(reference)).toHaveText('Amend');
      if (source === 'dashboard') {
        await plantsPages.dashboard
          .notificationCard(reference)
          .getByRole('link', { name: `Cancel amendment (${reference})`, exact: true })
          .click();
      } else if (source === 'CYA') {
        await plantsPages.notificationView.open(reference);
        await expect(plantsPages.notificationView.card('Identification numbers')).toContainText('DiscardMe99');
        await expect(plantsPages.notificationView.statusTag).toHaveText('Amend');
        await plantsPages.notificationView.cancelAmend.click();
      } else {
        await plantsPages.identificationNumbers.open(reference);
        await expect(plantsPages.identificationNumbers.statusTag).toHaveText('Amend');
        await plantsPages.identificationNumbers.cancelAmend.click();
      }
      await expect(pages.page.getByRole('heading', { name: 'Cancel this amendment?', level: 1 })).toBeVisible();
      await pages.page.getByRole('button', { name: 'Yes, cancel amendment', exact: true }).click();
      await expect(pages.page).toHaveURL(/\/notification-view\?cancelled=1$/);
      await assertReadOnly(plantsPages);
      await expect(pages.page.getByRole('alert')).toContainText(/amendment.*cancelled/i);
      await expect(plantsPages.notificationView.card('Identification numbers')).toContainText('P123');
      await expect(plantsPages.notificationView.card('Identification numbers')).not.toContainText('DiscardMe99');
      await pages.page.reload();
      await assertReadOnly(plantsPages);
      await expect(plantsPages.notificationView.card('Identification numbers')).toContainText('P123');
    });
  }

  test("Back from a submitted notification's view opens the notification list", async ({ plantsPages, plantsJourney, addressBookApi }) => {
    const { reference } = await plantsJourney.completeNotification(addressBookApi);
    await plantsJourney.submitFromReview();
    await plantsPages.dashboard.open();
    await plantsPages.dashboard.searchForReference(reference);
    await plantsPages.dashboard.view(reference).click();
    await assertReadOnly(plantsPages);
    await plantsPages.notificationView.linkBack.click();
    await expect(plantsPages.dashboard.heading).toBeVisible();
  });

  test('Back from an amendment review opens the overview', async ({
    plantsPages,
    plantsJourney,
    plantsNotificationActions,
    addressBookApi,
  }) => {
    await plantsNotificationActions.amendCompletedNotification(plantsJourney, addressBookApi);
    await plantsPages.overview.reviewTaskLink.click();
    await plantsPages.notificationView.linkBack.click();
    await expect(plantsPages.overview.heading).toBeVisible();
  });

  test('a submitted notification can be deleted from CYA', async ({
    plantsPages,
    plantsJourney,
    plantsNotificationActions,
    addressBookApi,
  }) => {
    const { reference } = await plantsJourney.completeNotification(addressBookApi);
    await expectReview(plantsPages);
    await plantsJourney.submitFromReview();
    await plantsNotificationActions.deleteNotification(reference);
    await expect(plantsPages.dashboard.heading).toBeVisible();
    await expect(plantsPages.dashboard.deletedBanner).toContainText('Notification deleted');
    await plantsPages.dashboard.searchForReference(reference);
    await expect(plantsPages.dashboard.notificationCard(reference)).toHaveCount(0);
  });

  for (const initiallyLate of [true, false]) {
    test(`resubmitting an amended arrival date preserves the original ${initiallyLate ? 'late' : 'on-time'} flag`, async ({
      pages,
      plantsPages,
      plantsJourney,
      plantsNotificationActions,
      addressBookApi,
    }) => {
      const { reference } = await plantsJourney.completeNotification(addressBookApi, { days: initiallyLate ? 0 : 7 });
      await expectReview(plantsPages);
      await plantsJourney.submitFromReview();
      await plantsPages.confirmation.viewNotification.click();
      await expect(plantsPages.notificationView.lateBanner).toHaveCount(initiallyLate ? 1 : 0);
      await plantsNotificationActions.amendNotification(reference);
      await expectAmending(pages, plantsPages, reference);
      await plantsPages.arrivalDetails.open(reference);
      const amendedDate = arrivalDate(initiallyLate ? 7 : 0);
      await plantsPages.arrivalDetails.arrivalDate.fill(amendedDate);
      await plantsPages.arrivalDetails.saveAndContinue.click();
      await plantsPages.notificationView.open(reference);
      await plantsJourney.submitFromReview();
      await expect(plantsPages.confirmation.lateBanner).toHaveCount(initiallyLate ? 1 : 0);
      await plantsPages.confirmation.viewNotification.click();
      await pages.page.reload();
      await assertReadOnly(plantsPages);
      await expect(plantsPages.notificationView.card('Arrival details')).toContainText(amendedDate);
      await expect(plantsPages.notificationView.lateBanner).toHaveCount(initiallyLate ? 1 : 0);
    });
  }

  test('while amending, an overview-linked page ends with the three amend controls and Save and return goes back to the review showing the change', async ({
    pages,
    plantsPages,
    plantsJourney,
    plantsNotificationActions,
    addressBookApi,
  }) => {
    const reference = await plantsNotificationActions.amendCompletedNotification(plantsJourney, addressBookApi);
    await expectAmending(pages, plantsPages, reference);

    await plantsPages.overview.taskRowLink('Identification numbers').click();
    await expect(plantsPages.identificationNumbers.heading).toBeVisible();
    await expect(plantsPages.identificationNumbers.saveAndReturn).toBeVisible();
    await expect(plantsPages.identificationNumbers.saveAndContinue).toBeVisible();
    await expect(plantsPages.identificationNumbers.saveAndReturnToOverview).toBeVisible();
    await expect(plantsPages.identificationNumbers.cancelAndReturnToOverview).toHaveCount(0);

    await plantsPages.identificationNumbers.producer.fill('AMENDED1');
    await plantsPages.identificationNumbers.saveAndReturn.click();

    await expect(pages.page).toHaveURL(plantsPages.notificationView.expectedUrl(reference));
    await expect(plantsPages.notificationView.card('Identification numbers')).toContainText('AMENDED1');
  });

  test('while amending, a question page opened from a Change link on the review returns to the review showing the change', async ({
    pages,
    plantsPages,
    plantsJourney,
    plantsNotificationActions,
    addressBookApi,
  }) => {
    const reference = await plantsNotificationActions.amendCompletedNotification(plantsJourney, addressBookApi);
    await expectAmending(pages, plantsPages, reference);

    await plantsPages.notificationView.open(reference);
    await plantsPages.notificationView
      .card('Identification numbers')
      .getByRole('link', { name: /^Change/ })
      .first()
      .click();
    await expect(plantsPages.identificationNumbers.heading).toBeVisible();
    await expect(plantsPages.identificationNumbers.saveAndReturn).toBeVisible();

    await plantsPages.identificationNumbers.producer.fill('CHANGED2');
    await plantsPages.identificationNumbers.saveAndReturn.click();

    await expect(pages.page).toHaveURL(plantsPages.notificationView.expectedUrl(reference));
    await expect(plantsPages.notificationView.card('Identification numbers')).toContainText('CHANGED2');
  });

  test('while amending, Save and continue goes to the next page of the task and Save and return to overview goes to Overview', async ({
    pages,
    plantsPages,
    plantsJourney,
    plantsNotificationActions,
    addressBookApi,
  }) => {
    const reference = await plantsNotificationActions.amendCompletedPlantsForPlanting(plantsJourney, addressBookApi);
    await expectAmending(pages, plantsPages, reference);

    await plantsPages.arrivalStatus.open(reference);
    await plantsPages.arrivalStatus.saveAndContinue.click();
    await expect(pages.page).toHaveURL(plantsPages.arrivalDetails.expectedUrl(reference));
    await expect(plantsPages.arrivalDetails.linkBack).toHaveAttribute('href', plantsPages.overview.expectedUrl(reference));

    await plantsPages.arrivalDetails.saveAndReturnToOverview.click();
    await expect(pages.page).toHaveURL(plantsPages.overview.expectedUrl(reference));
  });

  test('while amending, the address pickers end with Save and return and Save and continue only', async ({
    pages,
    plantsPages,
    plantsJourney,
    plantsNotificationActions,
    addressBookApi,
  }) => {
    const reference = await plantsNotificationActions.amendCompletedPlantsForPlanting(plantsJourney, addressBookApi);
    await expectAmending(pages, plantsPages, reference);

    await plantsPages.consignorSelect.open(reference);
    await expect(plantsPages.consignorSelect.saveAndReturn).toBeVisible();
    await expect(plantsPages.consignorSelect.saveAndContinue).toBeVisible();
    await expect(plantsPages.consignorSelect.saveAndReturnToOverview).toHaveCount(0);
    await expect(plantsPages.consignorSelect.cancelAndReturnToOverview).toHaveCount(0);
    await plantsPages.consignorSelect.saveAndReturn.click();
    await expect(pages.page).toHaveURL(plantsPages.notificationView.expectedUrl(reference));

    await plantsPages.placeOfDestination.open(reference);
    await expect(plantsPages.placeOfDestination.saveAndReturn).toBeVisible();
    await expect(plantsPages.placeOfDestination.saveAndContinue).toBeVisible();
    await expect(plantsPages.placeOfDestination.saveAndReturnToOverview).toHaveCount(0);

    await plantsPages.consignmentContactSelect.open(reference);
    await expect(plantsPages.consignmentContactSelect.saveAndReturn).toBeVisible();
    await expect(plantsPages.consignmentContactSelect.saveAndContinue).toBeVisible();
    await expect(plantsPages.consignmentContactSelect.saveAndReturnToOverview).toHaveCount(0);
  });

  test('Continue on an incomplete amendment stays on the review and shows There is a problem, naming what is missing', async ({
    pages,
    plantsPages,
    plantsJourney,
    plantsNotificationActions,
    addressBookApi,
  }) => {
    const reference = await plantsNotificationActions.amendCompletedNotification(plantsJourney, addressBookApi);
    await expectAmending(pages, plantsPages, reference);

    await plantsJourney.changeCommodityType(reference, WOOD_AND_CUT_TREES);

    await plantsPages.notificationView.open(reference);
    await expect(plantsPages.notificationView.errorSummary).toHaveCount(0);

    await plantsPages.notificationView.btnContinue.click();

    await expect(pages.page).toHaveURL(plantsPages.notificationView.expectedUrl(reference));
    await expect(plantsPages.notificationView.errorSummary).toContainText('There is a problem');
    await expect(plantsPages.notificationView.errorSummary.getByRole('link', { name: 'Complete arrival details' })).toHaveAttribute(
      'href',
      '#arrival-details',
    );
    await expect(plantsPages.overview.statusTag).toHaveText('Amend');
  });
});

test.describe('High-risk plants copied addresses are edited on the notification', () => {
  test('Edit details on CYA changes only this notification, not the address book record or another notification', async ({
    pages,
    plantsPages,
    plantsJourney,
    addressBookApi,
  }) => {
    test.slow();
    const { reference: otherReference, address } = await plantsJourney.completeNotification(addressBookApi);
    const { reference } = await plantsJourney.completeNotification(addressBookApi, { existing: address });
    const editedName = `Edited Holding ${randomUUID()}`;

    await plantsPages.notificationView.open(reference);
    await plantsPages.notificationView.editDetails('Place of destination').click();
    const form = plantsPages.placeOfDestinationEdit;
    await expect(form.heading).toBeVisible();
    await form.fill({ name: editedName, townOrCity: 'Dundee', postcode: 'DD1 1AA' });
    await form.saveChanges.click();

    await expect(pages.page).toHaveURL(plantsPages.notificationView.expectedUrl(reference));
    const destination = plantsPages.notificationView.card('Place of destination');
    await expect(destination).toContainText(editedName);
    await expect(destination).toContainText('Dundee');
    await expect(destination).not.toContainText('PH1 5EX');

    expect(await addressBookApi.getAddress(address.id)).toMatchObject({ name: address.name, townOrCity: 'Perth', deleted: false });

    await plantsPages.notificationView.open(otherReference);
    await expect(destination).toContainText(address.name);
    await expect(destination).not.toContainText(editedName);
  });

  test('the edit form opens from the picker with every field, including County', async ({
    pages,
    plantsPages,
    plantsJourney,
    addressBookApi,
  }) => {
    const { reference, address } = await plantsJourney.completeNotification(addressBookApi);

    await plantsPages.consignmentContactSelect.open(reference);
    await expect(plantsPages.consignmentContactSelect.currentAddress).toContainText(address.name);
    await plantsPages.consignmentContactSelect.editCurrentAddress.click();

    const form = plantsPages.contactAddressEdit;
    await expect(form.heading).toBeVisible();
    await expect(form.roleCaption).toBeVisible();
    await expect(form.name).toHaveValue(address.name);
    await expect(form.addressLine1).toHaveValue('4 Nursery Lane');
    await expect(form.addressLine2).toHaveValue('');
    await expect(form.townOrCity).toHaveValue('Perth');
    await expect(form.county).toHaveValue('Perthshire');
    await expect(form.postcode).toHaveValue('PH1 5EX');
    await expect(form.country).toHaveValue('GB');
    await expect(form.phone).toHaveValue('01738 555 0143');
    await expect(form.email).toHaveValue('review@example.co.uk');

    await form.fill({ name: 'Never Saved Ltd' });
    await form.cancel.click();
    await expect(pages.page).toHaveURL(plantsPages.consignmentContactSelect.expectedUrl(reference));
    await expect(plantsPages.consignmentContactSelect.currentAddress).toContainText(address.name);
    await expect(plantsPages.consignmentContactSelect.currentAddress).not.toContainText('Never Saved Ltd');
  });

  test('the consignor picker shows the copied address and its Edit details opens the consignor edit form', async ({
    pages,
    plantsPages,
    plantsJourney,
    addressBookApi,
  }) => {
    const { reference, address } = await plantsJourney.completeNotification(addressBookApi, {
      type: PLANTS_FOR_PLANTING,
      days: -1,
    });

    await plantsPages.consignorSelect.open(reference);
    await expect(plantsPages.consignorSelect.currentAddress).toContainText(address.name);
    await expect(plantsPages.consignorSelect.currentAddress).toContainText('PH1 5EX');
    await plantsPages.consignorSelect.editCurrentAddress.click();

    const form = plantsPages.consignorEdit;
    await expect(pages.page).toHaveURL((url) => url.pathname === form.expectedUrl(reference));
    await expect(form.heading).toBeVisible();
    await expect(form.roleCaption).toBeVisible();
    await expect(form.name).toHaveValue(address.name);
    await expect(form.postcode).toHaveValue('PH1 5EX');
  });

  test('an edit that breaks the address book rules is refused with its messages, and nothing is saved', async ({
    plantsPages,
    plantsJourney,
    addressBookApi,
  }) => {
    const { reference, address } = await plantsJourney.completeNotification(addressBookApi);

    await plantsPages.notificationView.open(reference);
    await plantsPages.notificationView.editDetails('Place of destination').click();
    const form = plantsPages.placeOfDestinationEdit;
    await form.fill({ name: '', postcode: 'PH1 5EX 12345', email: 'not-an-email' });
    await form.saveChanges.click();

    await expect(form.heading).toBeVisible();
    await expect(form.errorSummary).toContainText('Enter a name');
    await expect(form.errorSummary).toContainText('Postcode must be 12 characters or fewer');
    await expect(form.errorSummary).toContainText('Enter an email address in the correct format');
    await expect(form.name).toHaveAccessibleDescription(/Enter a name/);
    await expect(form.postcode).toHaveAccessibleDescription(/Postcode must be 12 characters or fewer/);
    await expect(form.email).toHaveAccessibleDescription(/Enter an email address in the correct format/);

    await plantsPages.notificationView.open(reference);
    const destination = plantsPages.notificationView.card('Place of destination');
    await expect(destination).toContainText(address.name);
    await expect(destination).not.toContainText('PH1 5EX 12345');
  });

  test('a copied address that breaks the address book rules blocks Continue and Submit until it is corrected', async ({
    pages,
    plantsPages,
    plantsJourney,
    addressBookApi,
  }) => {
    test.slow();
    const { reference } = await plantsJourney.completeNotification(addressBookApi, {
      countryCode: 'United Kingdom',
      name: `Invalid address (country "United Kingdom" is not a code) ${randomUUID()}`,
    });
    const error = 'Correct the address details for the place of destination';
    const contactError = 'Correct the contact address details for this consignment';

    await expectReview(plantsPages);
    await expect(plantsPages.notificationView.errorSummary).toContainText(error);
    await expect(plantsPages.notificationView.errorSummary).toContainText(contactError);
    await expect(plantsPages.notificationView.row('Place of destination', 'Address')).toContainText('Enter a valid country');
    await expect(plantsPages.notificationView.row('Place of destination', 'Name')).not.toContainText('Enter');
    await plantsPages.notificationView.btnContinue.click();
    await expect(pages.page).toHaveURL(plantsPages.notificationView.expectedUrl(reference));
    await expect(plantsPages.notificationView.errorSummary).toContainText(error);

    await plantsPages.declaration.open(reference);
    await plantsPages.declaration.checkbox.check();
    await plantsPages.declaration.btnContinue.click();
    await expect(pages.page).toHaveURL(plantsPages.notificationView.expectedUrl(reference));
    await expect(plantsPages.overview.statusTag).not.toHaveText('Submitted');

    await plantsPages.notificationView.errorSummary.getByRole('link', { name: error }).click();
    await expect(plantsPages.placeOfDestinationEdit.heading).toBeVisible();
    await plantsPages.placeOfDestinationEdit.country.selectOption('GB');
    await plantsPages.placeOfDestinationEdit.saveChanges.click();

    await expect(pages.page).toHaveURL(plantsPages.notificationView.expectedUrl(reference));
    await expect(plantsPages.notificationView.errorSummary).not.toContainText(error);
    await expect(plantsPages.notificationView.errorSummary).toContainText(contactError);

    await plantsPages.notificationView.errorSummary.getByRole('link', { name: contactError }).click();
    await expect(plantsPages.contactAddressEdit.heading).toBeVisible();
    await plantsPages.contactAddressEdit.country.selectOption('GB');
    await plantsPages.contactAddressEdit.saveChanges.click();

    await expect(pages.page).toHaveURL(plantsPages.notificationView.expectedUrl(reference));
    await expect(plantsPages.notificationView.errorSummary).toHaveCount(0);
    await plantsJourney.submitFromReview();
  });
});
