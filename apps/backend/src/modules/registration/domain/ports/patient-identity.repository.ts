import { PatientIdentity } from "~/modules/registration/domain/entities/patient-identity.entity";
import { HashedRsaId } from "~/modules/registration/domain/value-objects/hashed-rsaid";

export abstract class PatientIdentityRepository {
  abstract exists(identity: HashedRsaId): Promise<boolean>;

  abstract findById(identity: HashedRsaId): Promise<PatientIdentity | null>;
}
