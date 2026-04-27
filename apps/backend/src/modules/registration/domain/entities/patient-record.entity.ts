import { HashedRsaId } from "~/modules/registration/domain/value-objects/hashed-rsaid";
import { EncryptedValue } from "~/modules/registration/domain/value-objects/encrypted-value";

/**
 * Baseline fields copied from {@link PatientIdentity} when the patient first
 * verifies a registration link. Residential address is filled when a
 * registration is approved with submitted data.
 */
export class DraftPatientRecord {
  constructor(
    public readonly patientIdentityId: HashedRsaId,
    public readonly email?: EncryptedValue,
    public readonly phoneNumber?: EncryptedValue,
    public readonly fullName?: EncryptedValue,
    public readonly dateOfBirth?: EncryptedValue,
  ) {}
}

/**
 * Full contact profile applied to the canonical record on staff approval.
 */
export class UpdatePatientRecord {
  constructor(
    public readonly email: EncryptedValue | undefined,
    public readonly phoneNumber: EncryptedValue | undefined,
    public readonly residentialAddress: EncryptedValue | undefined,
    public readonly fullName: EncryptedValue | undefined,
    public readonly dateOfBirth: EncryptedValue | undefined,
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
    public readonly email: EncryptedValue | undefined,
    public readonly phoneNumber: EncryptedValue | undefined,
    public readonly residentialAddress: EncryptedValue | undefined,
    public readonly fullName: EncryptedValue | undefined,
    public readonly dateOfBirth: EncryptedValue | undefined,
    public readonly updatedAt: Date,
  ) {}
}
