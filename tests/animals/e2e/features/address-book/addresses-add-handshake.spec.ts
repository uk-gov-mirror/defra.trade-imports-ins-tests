import { test, expect } from '@fixtures';
import { skipUnlessComposeEnvironment } from '@utils/playwright/environment';
import { type NewAddressDetails } from '@page-objects/ins/address-book/add-page';
import { AnimalsAddressesPage } from '@page-objects/animals/addresses-page';

const insBaseUrl = (process.env.TRADE_IMPORTS_INS_FRONTEND_BASE_URL ?? 'http://localhost:3002').replace(/\/$/, '');
const insAddUrlPattern = new RegExp(`^${insBaseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/address-book/add\\?`);

test.describe('Add an address from the journey via INS', () => {
  test.beforeEach(() => {
    skipUnlessComposeEnvironment('the handshake crosses animals-frontend and ins-frontend, which only the compose stack runs together');
  });

  test(
    'saving a new address in INS returns to the picker with it selected and committed',
    { tag: ['@address-book', '@ins-frontend'] },
    async ({ animalsJourney, pages, animalsPages, insPages }) => {
      const stamp = Date.now();
      const farmName = `Handshake Farm ${stamp}`;
      const details: NewAddressDetails = {
        name: farmName,
        addressLine1: '9 Handshake Lane',
        townOrCity: 'Carlisle',
        postcode: 'CA2 7AA',
        country: 'United Kingdom',
        phone: '01228 555 0199',
        email: `handshake-${stamp}@example.co.uk`,
      };

      const referenceNumber = await animalsJourney.startNotification();
      await animalsJourney.answerCommodity();

      await animalsPages.overview.task('Roles and addresses').click();
      await animalsPages.addresses.addParty('Consignor').click();

      await animalsPages.consignorSelection.addNewAddress.click();
      await insPages.addressBookAdd.ensureSignedIn();
      await expect(pages.page).toHaveURL(insAddUrlPattern);
      await expect(insPages.addressBookAdd.heading).toBeVisible();

      await insPages.addressBookAdd.fill(details);
      await insPages.addressBookAdd.save();
      await expect(pages.page).toHaveURL((url) => url.pathname === animalsPages.consignorSelection.expectedUrl(referenceNumber), {
        timeout: 15_000,
      });

      await expect(animalsPages.consignorSelection.heading).toBeVisible();
      await animalsPages.consignorSelection.searchBox.fill(farmName);
      await animalsPages.consignorSelection.searchButton.click();
      await expect(animalsPages.consignorSelection.party(farmName)).toBeChecked();

      await animalsPages.consignorSelection.saveAndContinue.click();
      await expect(animalsPages.addresses.heading).toBeVisible();
      await expect(animalsPages.addresses.partyAddressLines('Consignor')).toHaveText(
        AnimalsAddressesPage.expectedAddressText({ ...details, name: farmName }),
        { useInnerText: true },
      );
    },
  );

  test(
    'cancelling INS add returns to the picker without saving an address',
    { tag: '@ins-frontend' },
    async ({ animalsJourney, pages, animalsPages, insPages }) => {
      const referenceNumber = await animalsJourney.startNotification();
      await animalsJourney.answerCommodity();

      await animalsPages.overview.task('Roles and addresses').click();
      await animalsPages.addresses.addParty('Consignor').click();

      await animalsPages.consignorSelection.addNewAddress.click();
      await insPages.addressBookAdd.ensureSignedIn();
      await expect(insPages.addressBookAdd.heading).toBeVisible();

      await insPages.addressBookAdd.btnCancelFromJourney.click();
      await expect(pages.page).toHaveURL((url) => url.pathname === animalsPages.consignorSelection.expectedUrl(referenceNumber), {
        timeout: 15_000,
      });

      await expect(animalsPages.consignorSelection.heading).toBeVisible();

      await animalsPages.consignorSelection.linkBack.click();
      await expect(animalsPages.addresses.heading).toBeVisible();
      await expect(animalsPages.addresses.partyLinks('Consignor')).toHaveText([AnimalsAddressesPage.addLinkName('Consignor')]);
    },
  );
});
