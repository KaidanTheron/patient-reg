import { EncryptedValue } from "../value-objects/encrypted-value";
import { HashedRsaId } from "../value-objects/hashed-rsaid";

export class PatientIdentity {
    constructor(
        public readonly identity: HashedRsaId,
        public readonly email?: EncryptedValue,
        public readonly phone?: EncryptedValue,
    ) {}
}