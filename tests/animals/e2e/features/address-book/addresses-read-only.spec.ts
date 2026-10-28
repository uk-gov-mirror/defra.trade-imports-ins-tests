import { SET_BASES } from '@page-objects/shared/sets';

import { test, expect } from '@fixtures';
import { skipIfNonStubStackEnvironment, skipUnlessNonStubStackEnvironment } from '@utils/playwright/environment';
import type { AnimalsPages } from '@page-objects';
import type { AnimalsAddressesPage } from '@page-objects/animals/addresses-page';
import type { AnimalsPartyPickerPage } from '@page-objects/animals/party-picker-page';

const PARTIES_CAPTION = 'Consignment parties';
const ADD_NEW_ADDRESS = 'Add a new address';

const PARTY_ADD_CONTROL_CASES: Array<{
  hubRole: Parameters<AnimalsAddressesPage['addParty']>[0];
  description: string;
  picker: (animalsPages: AnimalsPages) => AnimalsPartyPickerPage;
}> = [
  {
    hubRole: 'Consignor',
    description: 'This is the sender of the consignment.',
    picker: (animalsPages) => animalsPages.consignorSelection,
  },
  {
    hubRole: 'Place of origin',
    description: 'The address where the animals begin their journey to Great Britain',
    picker: (animalsPages) => animalsPages.placeOfOriginSelection,
  },
  {
    hubRole: 'Consignee',
    description: 'This is the receiver or buyer of the consignment being shipped or transported.',
    picker: (animalsPages) => animalsPages.consigneeSelection,
  },
  {
    hubRole: 'Importer',
    description: 'This is usually the same as the consignee. You can select a different person if needed.',
    picker: (animalsPages) => animalsPages.importerSelection,
  },
  {
    hubRole: 'Place of destination',
    description:
      'This is where the animals will be unloaded and accommodated for at least 48 hours. If a health certificate is required, it will show this address.',
    picker: (animalsPages) => animalsPages.destinationSelection,
  },
];

test.describe('Addresses are read-only in the journey', () => {
  test.describe('party picker add control', () => {
    for (const { hubRole, description, picker } of PARTY_ADD_CONTROL_CASES) {
      test.describe(hubRole, () => {
        test.beforeEach(async ({ animalsJourney, animalsPages }) => {
          await animalsJourney.startNotification();
          await animalsJourney.answerCommodity();

          await animalsPages.overview.task('Roles and addresses').click();
          await animalsPages.addresses.addParty(hubRole).click();
        });

        test('offers no add-address control in stub mode', async ({ animalsPages, pages }) => {
          skipIfNonStubStackEnvironment('the INS add control is shown when animals-frontend runs outside stub mode (compose or CDP)');
          await expect(picker(animalsPages).saveAndContinue).toBeVisible();
          await expect(picker(animalsPages).addNewAddress).toHaveCount(0);
          await expect(pages.page.getByRole('link', { name: ADD_NEW_ADDRESS })).toHaveCount(0);
        });

        test('holds only the caption and the heading in the heading row in stub mode', async ({ animalsPages }) => {
          skipIfNonStubStackEnvironment('the INS add control is shown when animals-frontend runs outside stub mode (compose or CDP)');
          await expect(picker(animalsPages).headingRowParts).toHaveText([PARTIES_CAPTION, picker(animalsPages).expectedHeading]);
        });

        test('offers one Add a new address button to INS beside the heading when the full stack is running', async ({
          animalsPages,
          pages,
        }) => {
          skipUnlessNonStubStackEnvironment('the handshake button is only rendered outside stub mode (compose or CDP)');
          await expect(picker(animalsPages).saveAndContinue).toBeVisible();
          await expect(picker(animalsPages).headingRowParts).toHaveText([
            PARTIES_CAPTION,
            picker(animalsPages).expectedHeading,
            ADD_NEW_ADDRESS,
          ]);
          await expect(picker(animalsPages).addNewAddress).toHaveAttribute('href', /\/address-book\/add\?journey-type=gbn-ag/);
          await expect(pages.page.getByRole('button', { name: ADD_NEW_ADDRESS })).toHaveCount(1);
          await expect(pages.page.getByRole('link', { name: ADD_NEW_ADDRESS })).toHaveCount(0);
        });

        test('puts the role description straight under the heading row', async ({ animalsPages }) => {
          await expect(picker(animalsPages).descriptionUnderHeading).toHaveText(description);
        });
      });
    }
  });

  test('the create-address page is no longer served', async ({ animalsJourney, journeyContext, pages }) => {
    await animalsJourney.startNotification();
    const referenceNumber = journeyContext.referenceNumber;

    const response = await pages.page.goto(`${SET_BASES.liveAnimals}/notifications/${referenceNumber}/addresses/create?for=consignor`);

    expect(response?.status()).toBe(404);
  });
});
