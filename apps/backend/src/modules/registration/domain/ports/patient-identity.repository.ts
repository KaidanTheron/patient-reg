import { HashedRsaId } from "../value-objects/hashed-rsaid";

export abstract class PatientIdentityRepository {
    abstract exists(identity: HashedRsaId): Promise<boolean>;
}