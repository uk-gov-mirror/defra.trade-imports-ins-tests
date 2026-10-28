import { test, expect } from '@fixtures';
import { AnimalsAddressesPage } from '@page-objects/animals/addresses-page';

test.describe('Addresses are copied, not linked', () => {
  test(
    'editing the record in the address book leaves the copy on a draft notification unchanged',
    { tag: '@address-book' },
    async ({ animalsJourney, pages, animalsPages, addressBookApi }) => {
      // Its own address rather than a shared fixture: this spec edits the record,
      // and the E2E fixtures are shared with every other spec running alongside it.
      // Distinct names, not one derived from the other, so "the new name is absent"
      // is a real assertion rather than one substring matching another.
      const stamp = Date.now();
      const originalName = `Copied Farm ${stamp}`;
      const renamed = `Renamed Holding ${stamp}`;
      const seeded = { name: originalName, addressLine1: '3 Copy Lane', townOrCity: 'Carlisle', postcode: 'CA1 1AA' };
      const address = await addressBookApi.createAddress({
        ...seeded,
        countryCode: 'GB',
        phone: '01228 555 0102',
        email: 'copied@example.co.uk',
      });

      await animalsJourney.startNotification();
      await animalsJourney.answerCommodity();

      await animalsPages.overview.task('Roles and addresses').click();
      const consignorAddressLines = animalsPages.addresses.partyAddressLines('Consignor');
      const chosenAddressText = AnimalsAddressesPage.expectedAddressText({ ...seeded, country: 'United Kingdom' });
      await animalsPages.addresses.addParty('Consignor').click();
      // Newly created, so it is at the back of the book — search rather than page.
      await animalsPages.consignorSelection.select(originalName);
      await animalsPages.consignorSelection.saveAndContinue.click();
      await expect(animalsPages.addresses.heading).toBeVisible();
      await expect(consignorAddressLines).toHaveText(chosenAddressText, { useInnerText: true });

      // Edit the record in the address book, with the journey none the wiser.
      await addressBookApi.updateAddress(address.id, {
        name: renamed,
        addressLine1: '3 Copy Lane',
        townOrCity: 'Penrith',
        postcode: 'CA11 7AA',
        countryCode: 'GB',
        phone: '01228 555 0102',
        email: 'copied@example.co.uk',
      });

      await pages.page.reload();
      await expect(consignorAddressLines).toHaveText(chosenAddressText, { useInnerText: true });

      // The full details on check-your-answers are still the ones copied at selection.
      const referenceNumber = animalsPages.addresses.referenceNumberFromUrl();
      await animalsPages.notificationView.open(referenceNumber);
      const consignorCyaRow = animalsPages.notificationView.partyRow('Roles and addresses', 'Consignor');
      await expect(consignorCyaRow).toContainText(originalName);
      await expect(consignorCyaRow).toContainText('Carlisle');
      await expect(consignorCyaRow).toContainText('CA1 1AA');
      await expect(consignorCyaRow).not.toContainText(renamed);
      await expect(consignorCyaRow).not.toContainText('Penrith');
      await expect(consignorCyaRow).not.toContainText('CA11 7AA');
    },
  );

  test('picking a record for a role with no address shows every field of that record on the review page', async ({
    animalsJourney,
    animalsPages,
    addressBookApi,
  }) => {
    // Every field set, each value distinct, so each assert proves its own field was copied.
    const stamp = Date.now();
    const record = {
      name: `Full Detail Farm ${stamp}`,
      addressLine1: '12 Primary Row',
      addressLine2: 'Secondary Wing',
      townOrCity: 'Kendal',
      county: 'Westmorland',
      postcode: 'LA9 4QQ',
      countryCode: 'GB',
      phone: '01539 555 0105',
      email: 'full.detail@example.co.uk',
    };
    await addressBookApi.createAddress(record);

    await animalsJourney.startNotification();
    await animalsJourney.answerCommodity();

    await animalsPages.overview.task('Roles and addresses').click();
    await animalsPages.addresses.addParty('Consignor').click();
    await animalsPages.consignorSelection.select(record.name);
    await animalsPages.consignorSelection.saveAndContinue.click();
    await expect(animalsPages.addresses.heading).toBeVisible();

    const referenceNumber = animalsPages.addresses.referenceNumberFromUrl();
    await animalsPages.notificationView.open(referenceNumber);
    const consignorCyaRow = animalsPages.notificationView.partyRow('Roles and addresses', 'Consignor');
    await expect(consignorCyaRow).toContainText(record.name);
    await expect(consignorCyaRow).toContainText(record.addressLine1);
    await expect(consignorCyaRow).toContainText(record.addressLine2);
    await expect(consignorCyaRow).toContainText(record.townOrCity);
    await expect(consignorCyaRow).toContainText(record.county);
    await expect(consignorCyaRow).toContainText(record.postcode);
    await expect(consignorCyaRow).toContainText('United Kingdom');
    await expect(consignorCyaRow).toContainText(record.phone);
    await expect(consignorCyaRow).toContainText(record.email);
  });

  test(
    'deleting the record in the address book leaves the copy on a draft notification unchanged, with no error, and drops it from the picker',
    { tag: '@address-book' },
    async ({ animalsSeededJourney, pages, animalsPages, addressBookApi }) => {
      // Own record so parallel specs do not race on a shared fixture when this one
      // soft-deletes behind the journey's back.
      const stamp = Date.now();
      const name = `Doomed Farm ${stamp}`;
      const seeded = { name, addressLine1: '7 Gone Street', townOrCity: 'Carlisle', postcode: 'CA1 2BB' };
      const address = await addressBookApi.createAddress({
        ...seeded,
        countryCode: 'GB',
        phone: '01228 555 0103',
        email: 'doomed@example.co.uk',
      });

      // A complete notification, so any error on the review page could only come from the deletion.
      const referenceNumber = await animalsSeededJourney.createDraftNotification();
      await animalsSeededJourney.resumeInUi(referenceNumber, animalsPages.addresses);
      const consignorAddressLines = animalsPages.addresses.partyAddressLines('Consignor');
      const chosenAddressText = AnimalsAddressesPage.expectedAddressText({ ...seeded, country: 'United Kingdom' });
      await animalsPages.addresses.changeParty('Consignor').click();
      await animalsPages.consignorSelection.select(name);
      await animalsPages.consignorSelection.saveAndContinue.click();
      await expect(animalsPages.addresses.heading).toBeVisible();
      await expect(consignorAddressLines).toHaveText(chosenAddressText, { useInnerText: true });

      // Soft-delete behind the journey's back. List/search omit tombstones; get
      // by id still returns deleted:true so the deletion is detectable.
      await addressBookApi.deleteAddress(address.id);
      const tombstone = await addressBookApi.getAddress(address.id);
      expect(tombstone.deleted).toBe(true);

      await pages.page.reload();
      await expect(consignorAddressLines).toHaveText(chosenAddressText, { useInnerText: true });
      const { change, editDetails } = AnimalsAddressesPage.partyLinkNames('Consignor');
      await expect(animalsPages.addresses.partyLinks('Consignor')).toHaveText([change, editDetails]);

      await animalsPages.notificationView.open(referenceNumber);
      const consignorCyaRow = animalsPages.notificationView.partyRow('Roles and addresses', 'Consignor');
      await expect(consignorCyaRow).toContainText(name);
      await expect(consignorCyaRow).toContainText('Carlisle');
      await expect(animalsPages.notificationView.errorSummary).toHaveCount(0);
      await animalsPages.notificationView.continueButton.click();
      await expect(animalsPages.declaration.heading).toBeVisible();

      // The picker neither pre-selects nor offers the deleted record.
      await animalsPages.addresses.open(referenceNumber);
      await animalsPages.addresses.changeParty('Consignor').click();
      await expect(animalsPages.consignorSelection.selectedAddress).toHaveCount(0);
      await animalsPages.consignorSelection.searchBox.fill(name);
      await animalsPages.consignorSelection.searchButton.click();
      await expect(animalsPages.consignorSelection.party(name)).toHaveCount(0);
    },
  );

  test('a copied address that breaks the address book rules is named on the review page, blocks continue and submit, and clears once corrected', async ({
    animalsSeededJourney,
    pages,
    animalsPages,
    addressBookApi,
    frontendForms,
  }) => {
    test.slow();

    // The address book checks only that a country is present, so a record can
    // hold a country name rather than a listed code. Its copy breaks the
    // notification's rules from the moment it is picked — the one way to reach
    // this state through the services alone.
    const stamp = Date.now();
    const name = `Invalid address (country "United Kingdom" is not a code) ${stamp}`;
    await addressBookApi.createAddress({
      name,
      addressLine1: '9 Swap Street',
      townOrCity: 'Carlisle',
      postcode: 'CA1 3CC',
      countryCode: 'United Kingdom',
      phone: '01228 555 0104',
      email: 'unlisted@example.co.uk',
    });

    const referenceNumber = await animalsSeededJourney.createDraftNotification();
    await animalsSeededJourney.resumeInUi(referenceNumber, animalsPages.addresses);
    await animalsPages.addresses.changeParty('Consignor').click();
    await animalsPages.consignorSelection.select(name);
    await animalsPages.consignorSelection.saveAndContinue.click();
    await expect(animalsPages.addresses.heading).toBeVisible();

    // Named at the top of the page and against the role's own row, with the address still shown.
    await animalsPages.notificationView.open(referenceNumber);
    const message = 'Correct the address details for the consignor';
    const consignorRow = animalsPages.notificationView.partyRow('Roles and addresses', 'Consignor');
    await expect(animalsPages.notificationView.errorSummary).toContainText(message);
    await expect(animalsPages.notificationView.partyError('Roles and addresses', 'Consignor')).toContainText(message);
    await expect(consignorRow).toContainText(name);
    await expect(consignorRow).toContainText('Carlisle');

    // Continuing past the review page is refused.
    await animalsPages.notificationView.continueButton.click();
    await expect(animalsPages.notificationView.heading).toBeVisible();
    await expect(animalsPages.notificationView.errorSummary).toContainText(message);

    // And so is the submit itself: the declaration hands back to the review page.
    await frontendForms.postForm(
      animalsPages.declaration.expectedUrl(referenceNumber),
      { declaration: 'confirmed' },
      {
        redirectsTo: /\/notification-view$/,
      },
    );

    // The message leads to the edit page, which hands back to the review once corrected.
    await animalsPages.notificationView.errorSummary.getByRole('link', { name: message }).click();
    await expect(animalsPages.consignorEdit.heading).toBeVisible();
    await animalsPages.consignorEdit.country.selectOption({ label: 'United Kingdom' });
    await animalsPages.consignorEdit.saveChanges.click();

    await expect(animalsPages.notificationView.heading).toBeVisible();
    await expect(animalsPages.notificationView.errorSummary).toHaveCount(0);
    await expect(consignorRow).toContainText(name);

    await animalsPages.notificationView.continueButton.click();
    await expect(animalsPages.declaration.heading).toBeVisible();
    await animalsPages.declaration.confirmation.check();
    await animalsPages.declaration.continueButton.click();
    await expect(pages.page.getByRole('heading', { name: 'Import notification submitted' })).toBeVisible();
  });
});
