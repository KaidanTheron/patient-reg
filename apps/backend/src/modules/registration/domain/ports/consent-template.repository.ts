import {
  ConsentTemplate,
  ConsentType,
  DraftConsentTemplate,
} from "~/modules/registration/domain/entities/consent-template.entity";

export abstract class ConsentTemplateRepository {
  abstract findActiveByPracticeAndType(
    practiceId: string,
    consentType: ConsentType,
  ): Promise<ConsentTemplate | null>;

  abstract create(template: DraftConsentTemplate): Promise<ConsentTemplate>;
}
