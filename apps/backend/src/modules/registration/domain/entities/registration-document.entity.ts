import { HashedRsaId } from "~/modules/registration/domain/value-objects/hashed-rsaid";
import { EncryptedValue } from "~/modules/registration/domain/value-objects/encrypted-value";
import { RegistrationRequest } from "~/modules/registration/domain/entities/registration-request.entity";

export class DraftRegistrationDocument {
  constructor(
    public readonly registrationRequestId: RegistrationRequest["id"],
    public readonly patientIdentityId: HashedRsaId,
    public readonly email: EncryptedValue,
    public readonly phoneNumber: EncryptedValue,
    public readonly residentialAddress: EncryptedValue,
    public readonly fullName: EncryptedValue,
    public readonly dateOfBirth: EncryptedValue,
  ) {}
}

export class UpdateRegistrationDocument {
  constructor(
    public readonly email: EncryptedValue,
    public readonly phoneNumber: EncryptedValue,
    public readonly residentialAddress: EncryptedValue,
    public readonly fullName: EncryptedValue,
    public readonly dateOfBirth: EncryptedValue,
    public readonly submittedAt: Date,
  ) {}
}

export class RegistrationDocument {
  constructor(
    public readonly id: string,
    public readonly registrationRequestId: RegistrationRequest["id"],
    public readonly patientIdentityId: HashedRsaId,
    public readonly email: EncryptedValue,
    public readonly phoneNumber: EncryptedValue,
    public readonly residentialAddress: EncryptedValue,
    public readonly fullName: EncryptedValue | undefined,
    public readonly dateOfBirth: EncryptedValue | undefined,
    public readonly submittedAt: Date,
  ) {}
}
