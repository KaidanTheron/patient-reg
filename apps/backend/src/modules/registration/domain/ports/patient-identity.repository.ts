import { PatientIdentity } from "../entities/patient-identity.entity";
import { HashedRsaId } from "../value-objects/hashed-rsaid";

export abstract class PatientIdentityRepository {
    abstract exists(identity: HashedRsaId): Promise<boolean>;

    abstract findById(identity: HashedRsaId): Promise<PatientIdentity | null>;
}