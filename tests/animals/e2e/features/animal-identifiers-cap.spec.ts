import { commoditySpecies } from '@domain/animals/constants/commodity-species';

import { test, expect } from '@fixtures';

test.describe('Animal identifiers cap', { tag: '@duplicated-in-frontend' }, () => {
  test('the N-of-M counter caps identifier records at the declared count, the full card shows only its saved animals, Remove frees a slot, and a count drop is refused with an error naming the species that lands on its card under the 0102 section', async ({
    animalsJourney,
    pages,
    animalsPages,
  }) => {
    test.slow();
    await animalsJourney.toAnimalIdentificationWithCounts([{ species: commoditySpecies.cattle, animalCount: 2 }]);

    await expect(animalsPages.animalIdentification.enterDetailsCounterHeading(commoditySpecies.cattle, 1, 2)).toBeVisible();
    await animalsPages.animalIdentification.earTag.fill('UK000000000001');
    await animalsPages.animalIdentification.saveAndAddAnother.click();
    await expect(animalsPages.animalIdentification.enterDetailsCounterHeading(commoditySpecies.cattle, 2, 2)).toBeVisible();
    await expect(animalsPages.animalIdentification.identifierColumn('Animal')).toBeVisible();
    await expect(animalsPages.animalIdentification.identifierColumn('Ear tag')).toBeVisible();
    await expect(animalsPages.animalIdentification.identifierColumn('Passport')).toBeVisible();
    await expect(
      animalsPages.animalIdentification
        .savedAnimalRow(commoditySpecies.cattle, 1)
        .getByRole('cell', { name: 'UK000000000001', exact: true }),
    ).toBeVisible();

    await animalsPages.animalIdentification.earTag.fill('UK000000000002');
    await animalsPages.animalIdentification.saveAndFinish.click();
    const card = animalsPages.animalIdentification.speciesCard(commoditySpecies.cattle);
    await expect(animalsPages.animalIdentification.savedAnimalRow(commoditySpecies.cattle, 1)).toBeVisible();
    await expect(animalsPages.animalIdentification.savedAnimalRow(commoditySpecies.cattle, 2)).toBeVisible();
    await expect(card.getByRole('button')).toHaveText([/^Remove/, /^Remove/]);
    await expect(card.getByRole('textbox')).toHaveCount(0);
    await expect(card.getByRole('paragraph')).toHaveCount(0);
    await expect(card.getByRole('heading')).toHaveText([commoditySpecies.cattle.latinName]);
    await expect(card.getByRole('link')).toHaveText([/^Change number of animals/]);
    await expect(animalsPages.animalIdentification.savedAnimalsRows(commoditySpecies.cattle)).toHaveCount(2);

    await animalsPages.animalIdentification.saveAndContinue.click();
    await expect(animalsPages.overview.heading).toBeVisible();
    await animalsPages.overview.task('Commodity details').click();
    await expect(animalsPages.consignmentDetails.heading).toBeVisible();
    await animalsPages.consignmentDetails.numberOfAnimals.fill('1');
    await animalsPages.consignmentDetails.saveAndContinue.click();
    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toBeVisible();
    const dropError = pages.page.getByRole('link', {
      name: `You have 2 identifier records for ${commoditySpecies.cattle.latinName} but entered 1 animal. Remove identifier records or keep the higher count.`,
    });
    await expect(dropError).toBeVisible();
    await dropError.click();
    await expect(animalsPages.animalIdentification.heading).toBeVisible();
    await expect(pages.page).toHaveURL(/#identification-card-0$/);
    await expect(animalsPages.animalIdentification.commodityHeading(commoditySpecies.cattle.commodityCode)).toBeVisible();
    await expect(card.getByRole('heading', { name: commoditySpecies.cattle.latinName, exact: true })).toBeVisible();
    await expect(animalsPages.animalIdentification.savedAnimalRow(commoditySpecies.cattle, 2)).toBeVisible();

    await animalsPages.animalIdentification.savedAnimalRow(commoditySpecies.cattle, 2).getByRole('button', { name: 'Remove' }).click();
    await expect(animalsPages.animalIdentification.enterDetailsCounterHeading(commoditySpecies.cattle, 2, 2)).toBeVisible();

    await animalsPages.animalIdentification.saveAndContinue.click();
    await expect(animalsPages.overview.heading).toBeVisible();
    await animalsPages.overview.task('Commodity details').click();
    await expect(animalsPages.consignmentDetails.heading).toBeVisible();
    await animalsPages.consignmentDetails.numberOfAnimals.fill('1');
    await animalsPages.consignmentDetails.saveAndContinue.click();
    await expect(animalsPages.overview.heading).toBeVisible();
  });
});
