import { test, expect } from '@fixtures';
import { AnimalsAddressesPage } from '@page-objects/animals/addresses-page';

const FIVE_RESULTS_SUMMARY = /^Showing 5 out of \d+ results$/;

test.describe('Addresses picker', { tag: ['@duplicated-in-frontend', '@address-book'] }, () => {
  test('the picker searches and pages the address book, and the row selected on a later page is the one that saves', async ({
    animalsJourney,
    pages,
    animalsPages,
    addressBookApi,
  }) => {
    const page = pages.page;
    // Own records for every leg that counts rows: the address book is shared and
    // never wiped, so a search has to be scoped to a token only this run minted.
    const stamp = Date.now();
    const searchToken = `Kolding${stamp}`;
    const searchMatches = [`Danish Meat Export ${searchToken}`, `Jutland Swine ${searchToken}`];
    for (const name of searchMatches) {
      await addressBookApi.createAddress({
        name,
        addressLine1: 'Havnegade 21',
        townOrCity: 'Copenhagen',
        postcode: '1058',
        countryCode: 'DK',
        phone: '01228 555 0197',
        email: 'searchable@example.co.uk',
      });
    }

    // Pagination leg: create the target first, then five newer ones so
    // newest-first listing pushes the target off page one.
    const targetName = `Paged Consignor ${stamp}`;
    const targetRecord = { name: targetName, addressLine1: '1 Later Page Lane', townOrCity: 'Carlisle', postcode: 'CA1 1AA' };
    const targetAddressText = AnimalsAddressesPage.expectedAddressText({ ...targetRecord, country: 'United Kingdom' });
    await addressBookApi.createAddress({
      ...targetRecord,
      countryCode: 'GB',
      phone: '01228 555 0199',
      email: 'paged@example.co.uk',
    });
    for (let i = 0; i < 5; i += 1) {
      await addressBookApi.createAddress({
        name: `Newer Than Target ${stamp} ${i}`,
        addressLine1: `${i} Front Row`,
        townOrCity: 'Carlisle',
        postcode: 'CA1 1BB',
        countryCode: 'GB',
        phone: '01228 555 0198',
        email: 'newer@example.co.uk',
      });
    }

    await animalsJourney.startNotification();
    await animalsJourney.answerCommodity();

    await animalsPages.overview.task('Roles and addresses').click();
    const consignorAddressLines = animalsPages.addresses.partyAddressLines('Consignor');
    await animalsPages.addresses.addParty('Consignor').click();

    await expect(animalsPages.consignorSelection.resultsHeading).toBeVisible();
    await expect(animalsPages.consignorSelection.resultsSummary).toHaveText(FIVE_RESULTS_SUMMARY);
    await expect(animalsPages.consignorSelection.resultsGroup.getByRole('radio')).toHaveCount(5);

    await animalsPages.consignorSelection.searchBox.fill('Tech Imports Ltd');
    await animalsPages.consignorSelection.searchButton.click();
    const detailedRow = page.locator('tr', { hasText: 'Tech Imports Ltd' });
    const rowDetails = detailedRow.locator('details');
    await expect(rowDetails.locator('.govuk-details__text')).toBeHidden();
    await rowDetails.locator('summary').click();
    await expect(rowDetails.locator('.govuk-details__text')).toBeVisible();
    await expect(rowDetails).toContainText('London');

    await animalsPages.consignorSelection.searchBox.fill(searchToken);
    await animalsPages.consignorSelection.searchButton.click();
    await expect(animalsPages.consignorSelection.resultsSummary).toHaveText('Showing 2 out of 2 results');
    await expect(animalsPages.consignorSelection.party(searchMatches[1])).toBeVisible();
    await expect(page.getByRole('link', { name: 'Page 2' })).toHaveCount(0);

    await animalsPages.consignorSelection.searchBox.fill('');
    await animalsPages.consignorSelection.searchButton.click();
    await expect(animalsPages.consignorSelection.resultsSummary).toHaveText(FIVE_RESULTS_SUMMARY);

    await expect(animalsPages.consignorSelection.party(targetName)).toHaveCount(0);
    const target = animalsPages.consignorSelection.party(targetName);
    const nextLink = page.getByRole('link', { name: /Next/ });
    const currentPageNumber = page.locator('[aria-current="page"]');
    // Other workers add to the shared book mid-walk, so follow Next until it runs out
    // rather than to a last page computed before the walk started.
    for (let landedOn = 1; (await target.count()) === 0; landedOn += 1) {
      if ((await nextLink.count()) === 0) {
        break;
      }
      await nextLink.click();
      await expect(currentPageNumber).toHaveText(String(landedOn + 1));
    }
    await expect(target).toBeVisible();

    await animalsPages.consignorSelection.party(targetName).check();
    await animalsPages.consignorSelection.saveAndContinue.click();
    await expect(animalsPages.addresses.heading).toBeVisible();
    await expect(consignorAddressLines).toHaveText(targetAddressText, { useInnerText: true });

    await animalsPages.addresses.changeParty('Consignor').click();
    await expect(animalsPages.consignorSelection.heading).toBeVisible();
    await expect(animalsPages.consignorSelection.selectedAddress).toHaveText(`Selected address: ${targetName}`);
    await expect(animalsPages.consignorSelection.party(targetName)).toHaveCount(0);
    await animalsPages.consignorSelection.saveAndContinue.click();
    await expect(animalsPages.addresses.heading).toBeVisible();
    await expect(consignorAddressLines).toHaveText(targetAddressText, { useInnerText: true });
  });

  test('saving with nothing ticked returns to the roles and addresses page with the consignor section offering only its add link', async ({
    animalsJourney,
    animalsPages,
  }) => {
    await animalsJourney.startNotification();
    await animalsJourney.answerCommodity();
    await animalsPages.overview.task('Roles and addresses').click();
    await animalsPages.addresses.addParty('Consignor').click();

    await animalsPages.consignorSelection.saveAndContinue.click();

    await expect(animalsPages.addresses.heading).toBeVisible();
    await expect(animalsPages.addresses.partyLinks('Consignor')).toHaveText([AnimalsAddressesPage.addLinkName('Consignor')]);
  });
});
