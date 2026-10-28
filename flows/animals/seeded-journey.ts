import type { Locator } from '@playwright/test';
import { pageLoadWait } from '@config/timeouts';
import type { FrontendFormClient } from '@adapters/http/frontend-form-client';
import type { AddressBookApiClient } from '@adapters/http/address-book-api-client';
import {
  declarationStep,
  seedSteps,
  type DraftStage,
  type PartyIds,
  type PartyNames,
  type PartyRole,
  type SeedStep,
} from '@flows/animals/seed-form-steps';
import { MANDATORY_ANSWERS, type NotificationAnswers } from '@domain/animals/constants/journey-options';
import type { JourneyContext } from '@flows/shared/journey-context';
import { SET_BASES } from '@page-objects/shared/sets';

export const CREATE_PATH = `${SET_BASES.liveAnimals}/notifications`;
const CREATED_AT_ORIGIN = new RegExp(`^${CREATE_PATH}/(?<referenceNumber>[^/]+)/origin$`);
const CONCURRENCY_TOKEN_FIELD = /name="concurrencyToken" value="(?<token>[^"]+)"/;

const concurrencyTokenIn = (html: string, slug: string): string => {
  const token = CONCURRENCY_TOKEN_FIELD.exec(html)?.groups?.token;
  if (!token) {
    throw new Error(`The ${slug} page rendered no concurrencyToken field, so there is nothing to declare against.`);
  }
  return token;
};

export class AnimalsSeededJourney {
  private readonly partyIdByName = new Map<string, string>();

  constructor(
    private readonly forms: FrontendFormClient,
    private readonly addressBook: AddressBookApiClient,
    private readonly context: JourneyContext,
  ) {}

  async createEmptyNotification(): Promise<string> {
    const location = await this.forms.postForm(CREATE_PATH);
    const referenceNumber = CREATED_AT_ORIGIN.exec(location)?.groups?.referenceNumber;
    if (!referenceNumber) {
      throw new Error(`POST ${CREATE_PATH} redirected to "${location}", which is not a new notification's origin page.`);
    }
    return this.remember(referenceNumber);
  }

  async createDraftNotification(stage: DraftStage = 'ready', answers: NotificationAnswers = MANDATORY_ANSWERS): Promise<string> {
    const referenceNumber = await this.createEmptyNotification();
    for (const step of await seedSteps((names) => this.partyIds(names), stage, answers)) {
      await this.postSeedStep(`${CREATE_PATH}/${referenceNumber}/${step.slug}`, step);
    }
    return referenceNumber;
  }

  private async postSeedStep(path: string, { form, returnsHtml }: SeedStep): Promise<void> {
    if (returnsHtml) {
      await this.forms.postFormReturningHtml(path, form);
    } else {
      await this.forms.postForm(path, form);
    }
  }

  async createSubmittedNotification(answers: NotificationAnswers = MANDATORY_ANSWERS): Promise<string> {
    const referenceNumber = await this.createDraftNotification('ready', answers);
    const declarationPath = `${CREATE_PATH}/${referenceNumber}/${declarationStep.slug}`;
    const review = await this.forms.getPageHtml(`${CREATE_PATH}/${referenceNumber}/${declarationStep.reviewSlug}`);
    const concurrencyToken = concurrencyTokenIn(review, declarationStep.reviewSlug);
    const declaration = await this.forms.postFormReturningHtml(declarationPath, { ...declarationStep.review, concurrencyToken });
    await this.forms.postForm(
      declarationPath,
      { ...declarationStep.declare, concurrencyToken: concurrencyTokenIn(declaration, declarationStep.slug) },
      { redirectsTo: /\/confirmation$/ },
    );
    return referenceNumber;
  }

  async createAmendNotification(answers: NotificationAnswers = MANDATORY_ANSWERS): Promise<string> {
    const referenceNumber = await this.createSubmittedNotification(answers);
    await this.amend(referenceNumber);
    return referenceNumber;
  }

  async amend(referenceNumber: string): Promise<void> {
    await this.forms.postForm(
      `${CREATE_PATH}/${referenceNumber}/amend`,
      {},
      { redirectsTo: new RegExp(`^${CREATE_PATH}/${referenceNumber}$`) },
    );
  }

  async cancelAmend(referenceNumber: string): Promise<void> {
    await this.forms.postForm(`${CREATE_PATH}/${referenceNumber}/cancel-amend`, {}, { redirectsTo: /\/notification-view\?cancelled=1$/ });
  }

  async softDelete(referenceNumber: string): Promise<void> {
    await this.forms.postForm(`${CREATE_PATH}/${referenceNumber}/delete`, {}, { redirectsTo: /\?deleted=1$/ });
  }

  async resumeInUi<T extends { open(referenceNumber: string): Promise<void>; heading: Locator }>(
    referenceNumber: string,
    targetPage: T,
  ): Promise<T> {
    await targetPage.open(referenceNumber);
    await targetPage.heading.waitFor(pageLoadWait);
    return targetPage;
  }

  private async partyIds(names: PartyNames): Promise<PartyIds> {
    const roles = Object.keys(names) as PartyRole[];
    const ids = await Promise.all(roles.map((role) => this.partyIdFor(names[role])));
    return Object.fromEntries(roles.map((role, index) => [role, ids[index]])) as PartyIds;
  }

  private async partyIdFor(name: string): Promise<string> {
    const known = this.partyIdByName.get(name);
    if (known) return known;
    const { id } = await this.addressBook.findByName(name);
    this.partyIdByName.set(name, id);
    return id;
  }

  private remember(referenceNumber: string): string {
    this.context.recordReferenceNumber(referenceNumber);
    return referenceNumber;
  }
}
