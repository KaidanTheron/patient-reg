import { EncryptedValue } from "~/modules/registration/domain/value-objects/encrypted-value";
import { HashedRsaId } from "~/modules/registration/domain/value-objects/hashed-rsaid";

export class PatientIdentity {
  constructor(
    public readonly identity: HashedRsaId,
    public readonly email?: EncryptedValue,
    public readonly phone?: EncryptedValue,
    public readonly fullName?: EncryptedValue,
  ) {}
}
