import { test, expect } from '@fixtures';

const transporter = {
  approvalNumber: 'NI/TA/2026/0041',
  name: 'Lough Neagh Livestock Haulage Ltd',
  addressLine1: '4 Shore Road',
  townOrCity: 'Antrim',
  postalOrZipCode: 'BT41 4LB',
  emailAddress: 'ops@loughneagh.example',
  telephoneNumber: '+44 28 9446 1200',
};

test.describe('Commercial transporter scope', { tag: '@duplicated-in-frontend' }, () => {
  test('commercial transporter is owed only for the commercial type and is wiped when the type changes', async ({
    animalsJourney,
    animalsPages,
  }) => {
    await animalsJourney.startNotification();
    await animalsJourney.unlockSections();

    await animalsJourney.reachTransporterFromHub();
    await animalsJourney.chooseTransporterType('Commercial');
    await expect(animalsPages.commercialTransporter.heading).toBeVisible();
    await expect(animalsPages.commercialTransporter.country).toHaveValue('Northern Ireland');
    await animalsPages.commercialTransporter.fill(transporter);
    await animalsPages.commercialTransporter.saveAndContinue.click();
    await expect(animalsPages.overview.heading).toBeVisible();

    await animalsJourney.openTransporterFromOverview();
    await animalsJourney.chooseTransporterType('Commercial');
    await expect(animalsPages.commercialTransporter.heading).toBeVisible();
    await expect(animalsPages.commercialTransporter.approvalNumber).toHaveValue(transporter.approvalNumber);
    await expect(animalsPages.commercialTransporter.nameOrOrganisationName).toHaveValue(transporter.name);
    await animalsPages.commercialTransporter.saveAndContinue.click();

    await animalsJourney.openTransporterFromOverview();
    await animalsJourney.chooseTransporterType('Private');
    await expect(animalsPages.privateTransporter.heading).toBeVisible();
    await animalsPages.privateTransporter.saveAndContinue.click();
    await expect(animalsPages.overview.heading).toBeVisible();

    await animalsJourney.openTransporterFromOverview();
    await animalsJourney.chooseTransporterType('Commercial');
    await expect(animalsPages.commercialTransporter.heading).toBeVisible();
    await expect(animalsPages.commercialTransporter.approvalNumber).toHaveValue('');
    await expect(animalsPages.commercialTransporter.nameOrOrganisationName).toHaveValue('');
  });
});
