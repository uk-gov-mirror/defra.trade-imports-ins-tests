import { commoditySpecies } from '@domain/animals/constants/commodity-species';

import { test, expect } from '@fixtures';

test.describe('CPH scope', { tag: '@duplicated-in-frontend' }, () => {
  test('the CPH page and the CPH section of the addresses page show only when a CPH-triggering commodity line exists', async ({
    animalsJourney,
    animalsPages,
  }) => {
    test.slow();

    await animalsJourney.startNotification();

    const { cphSection, cphLinks, cphNumberText } = animalsPages.addresses;

    await animalsJourney.addSpeciesToCurrentNotification(commoditySpecies.domesticCat);
    await animalsJourney.toRolesAndAddressesOfCurrentNotification();
    await expect(cphSection).toBeHidden();
    await animalsPages.addresses.continueButton.click();
    await expect(animalsPages.overview.heading).toBeVisible();
    await expect(animalsPages.cphNumber.heading).toBeHidden();

    await animalsJourney.addSpeciesToCurrentNotification(commoditySpecies.cattle);
    await animalsJourney.toRolesAndAddressesOfCurrentNotification();
    await expect(cphSection).toBeVisible();
    await expect(cphLinks).toHaveText(['Add a CPH number']);

    await animalsPages.addresses.addCph.click();
    await expect(animalsPages.cphNumber.heading).toBeVisible();
    await animalsPages.cphNumber.fillCphNumber();
    await animalsPages.cphNumber.saveAndContinue.click();
    await expect(animalsPages.addresses.heading).toBeVisible();
    await expect(cphNumberText).toHaveText('123456789');
    await expect(cphLinks).toHaveText([animalsPages.addresses.cphLinkNames.change]);

    await animalsPages.addresses.changeCph.click();
    await expect(animalsPages.cphNumber.county).toHaveValue('12');
    await expect(animalsPages.cphNumber.parish).toHaveValue('345');
    await expect(animalsPages.cphNumber.holding).toHaveValue('6789');
    await animalsPages.cphNumber.linkBack.click();
    await expect(animalsPages.addresses.heading).toBeVisible();

    await animalsPages.addresses.continueButton.click();
    await expect(animalsPages.overview.heading).toBeVisible();
    await expect(animalsPages.cphNumber.heading).toBeHidden();
  });
});
