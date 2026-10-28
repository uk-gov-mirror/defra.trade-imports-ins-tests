import { test, expect } from '@fixtures';

const transporter = {
  name: 'Jean Dupont',
  address: {
    addressLine1: '12 Rue des Fermes',
    townOrCity: 'Amiens',
    postalOrZipCode: '80000',
    country: 'France',
    telephoneNumber: '+33 3 22 55 01 44',
    emailAddress: 'jean.dupont@example.fr',
  },
};

test.describe('Private transporter scope', { tag: '@duplicated-in-frontend' }, () => {
  test('keyed-in details are owed only for the private type; a partial fill blocks the save; changing the type wipes them', async ({
    animalsJourney,
    pages,
    animalsPages,
  }) => {
    await animalsJourney.startNotification();
    await animalsJourney.answerCommodity();

    await animalsJourney.reachTransporterFromHub();
    await animalsJourney.chooseTransporterType('Private');
    await expect(animalsPages.privateTransporter.heading).toBeVisible();
    await animalsPages.privateTransporter.name.fill(transporter.name);
    await animalsPages.privateTransporter.saveAndContinue.click();
    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toBeVisible();
    await expect(pages.page.getByRole('link', { name: 'Enter address line 1' })).toBeVisible();

    await animalsPages.privateTransporter.addressLine1.fill(transporter.address.addressLine1);
    await animalsPages.privateTransporter.townOrCity.fill(transporter.address.townOrCity);
    await animalsPages.privateTransporter.postcode.fill(transporter.address.postalOrZipCode);
    await animalsPages.privateTransporter.country.selectOption(transporter.address.country);
    await animalsPages.privateTransporter.phone.fill(transporter.address.telephoneNumber);
    await animalsPages.privateTransporter.email.fill(transporter.address.emailAddress);
    await animalsPages.privateTransporter.saveAndContinue.click();
    await expect(animalsPages.overview.heading).toBeVisible();

    await animalsJourney.openTransporterFromOverview();
    await animalsJourney.chooseTransporterType('Private');
    await expect(animalsPages.privateTransporter.heading).toBeVisible();
    await expect(animalsPages.privateTransporter.name).toHaveValue(transporter.name);
    await expect(animalsPages.privateTransporter.country).toHaveValue(transporter.address.country);
    await animalsPages.privateTransporter.saveAndContinue.click();

    await animalsJourney.openTransporterFromOverview();
    await animalsJourney.chooseTransporterType('Commercial');
    await expect(animalsPages.commercialTransporter.heading).toBeVisible();
    await animalsPages.commercialTransporter.saveAndContinue.click();
    await expect(animalsPages.overview.heading).toBeVisible();

    await animalsJourney.openTransporterFromOverview();
    await animalsJourney.chooseTransporterType('Private');
    await expect(animalsPages.privateTransporter.heading).toBeVisible();
    await expect(animalsPages.privateTransporter.name).toHaveValue('');
    await expect(animalsPages.privateTransporter.country).toHaveValue('');
  });
});
