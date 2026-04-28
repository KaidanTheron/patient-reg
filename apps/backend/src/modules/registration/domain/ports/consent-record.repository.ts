import {
  ConsentRecord,
  DraftConsentRecord,
} from "~/modules/registration/domain/entities/consent-record.entity";

export abstract class ConsentRecordRepository {
  abstract create(draft: DraftConsentRecord): Promise<ConsentRecord>;

  abstract findByRegistrationRequestId(
    registrationRequestId: string,
  ): Promise<ConsentRecord | null>;
}
