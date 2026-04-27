import { HashedRsaId } from "../value-objects/hashed-rsaid";
import { EncryptedValue } from "../value-objects/encrypted-value";
import { RegistrationRequest } from "./registration-request.entity";

export class DraftRegistrationDocument {
  constructor(
    public readonly registrationRequestId: RegistrationRequest["id"],
    public readonly patientIdentityId: HashedRsaId,
    public readonly email: EncryptedValue,
    public readonly phoneNumber: EncryptedValue,
    public readonly residentialAddress: EncryptedValue,
    public readonly fullName: EncryptedValue,
  ) {}
}

export class UpdateRegistrationDocument {
  constructor(
    public readonly email: EncryptedValue,
    public readonly phoneNumber: EncryptedValue,
    public readonly residentialAddress: EncryptedValue,
    public readonly fullName: EncryptedValue,
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
    public readonly submittedAt: Date,
  ) {}
}
