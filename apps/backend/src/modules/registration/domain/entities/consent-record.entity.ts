import { HashedRsaId } from "~/modules/registration/domain/value-objects/hashed-rsaid";

export class ConsentRecord {
  constructor(
    public readonly id: string,
    public readonly registrationRequestId: string,
    public readonly patientIdentityId: HashedRsaId,
    public readonly consentTemplateId: string,
    public readonly givenAt: Date,
  ) {}
}

export class DraftConsentRecord {
  constructor(
    public readonly registrationRequestId: string,
    public readonly patientIdentityId: HashedRsaId,
    public readonly consentTemplateId: string,
  ) {}
}
