import { HashedRsaId } from "~/modules/registration/domain/value-objects/hashed-rsaid";
import { RegistrationRequest } from "~/modules/registration/domain/entities/registration-request.entity";
import {
  ContactDetails,
  MedicalAidDetails,
  MedicalHistory,
  PersonalInformation
} from "~/modules/registration/domain/value-objects";

export class DraftRegistrationDocument {
  constructor(
    public readonly registrationRequestId: RegistrationRequest["id"],
    public readonly patientIdentityId: HashedRsaId,
    public readonly contactDetails: ContactDetails,
    public readonly personalInformation: PersonalInformation,
    public readonly medicalAidDetails: MedicalAidDetails,
    public readonly medicalHistory: MedicalHistory,
  ) {}
}

export class UpdateRegistrationDocument {
  constructor(
    public readonly contactDetails: ContactDetails,
    public readonly personalInformation: PersonalInformation,
    public readonly medicalAidDetails: MedicalAidDetails,
    public readonly medicalHistory: MedicalHistory,
    public readonly submittedAt: Date,
  ) {}
}

export class RegistrationDocument {
  constructor(
    public readonly id: string,
    public readonly registrationRequestId: RegistrationRequest["id"],
    public readonly patientIdentityId: HashedRsaId,
    public readonly contactDetails: ContactDetails,
    public readonly personalInformation: PersonalInformation,
    public readonly medicalAidDetails: MedicalAidDetails,
    public readonly medicalHistory: MedicalHistory,
    public readonly submittedAt: Date,
  ) {}
}
