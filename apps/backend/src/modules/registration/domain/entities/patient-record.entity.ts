import { HashedRsaId } from "~/modules/registration/domain/value-objects/hashed-rsaid";
import {
  ContactDetails,
  MedicalAidDetails,
  MedicalHistory,
  PersonalInformation
} from "~/modules/registration/domain/value-objects";

/**
 * Baseline fields copied from {@link PatientIdentity} when the patient first
 * verifies a registration link. Residential address is filled when a
 * registration is approved with submitted data.
 */
export class DraftPatientRecord {
  constructor(
    public readonly patientIdentityId: HashedRsaId,
    public readonly contactDetails: ContactDetails,
    public readonly personalInformation: PersonalInformation,
    public readonly medicalAidDetails: MedicalAidDetails,
    public readonly medicalHistory: MedicalHistory,
  ) {}
}

/**
 * Full contact profile applied to the canonical record on staff approval.
 */
export class UpdatePatientRecord {
  constructor(
    public readonly contactDetails: ContactDetails,
    public readonly personalInformation: PersonalInformation,
    public readonly medicalAidDetails: MedicalAidDetails,
    public readonly medicalHistory: MedicalHistory,
  ) {}
}

/**
 * Decrypted patient profile stored in the canonical `patient_records` table.
 * Identity (hashed RSA id) remains the stable key; this aggregate is mutable.
 */
export class PatientRecord {
  constructor(
    public readonly id: string,
    public readonly patientIdentityId: HashedRsaId,
    public readonly contactDetails: ContactDetails,
    public readonly personalInformation: PersonalInformation,
    public readonly medicalAidDetails: MedicalAidDetails,
    public readonly medicalHistory: MedicalHistory,
    public readonly updatedAt: Date,
  ) {}
}
