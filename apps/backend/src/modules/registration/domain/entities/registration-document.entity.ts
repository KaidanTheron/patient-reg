import { HashedRsaId } from "../value-objects/hashed-rsaid";
import { ContactDetails } from "../value-objects/contact-details";
import { RegistrationRequest } from "./registration-request.entity";

export class DraftRegistrationDocument {
  constructor(
    public readonly registrationRequestId: RegistrationRequest["id"],
    public readonly patientIdentityId: HashedRsaId,
    public readonly contactDetails: ContactDetails,
  ) {}
}

export class UpdateRegistrationDocument {
  constructor(
    public readonly contactDetails: ContactDetails,
    public readonly submittedAt: Date,
  ) {}
}

export class RegistrationDocument {
  constructor(
    public readonly id: string,
    public readonly registrationRequestId: RegistrationRequest["id"],
    public readonly patientIdentityId: HashedRsaId,
    public readonly contactDetails: ContactDetails,
    public readonly submittedAt: Date,
  ) {}
}
