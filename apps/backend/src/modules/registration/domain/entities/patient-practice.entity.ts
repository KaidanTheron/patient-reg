import { HashedRsaId } from "~/modules/registration/domain/value-objects/hashed-rsaid";
import { Practice } from "~/modules/registration/domain/entities/practice.entity";

/**
 * Proposed patient–practice membership before persistence. Created when a
 * registration request is approved; the application service establishes the
 * link after the request status is updated.
 */
export class DraftPatientPractice {
  public readonly patientIdentityId: HashedRsaId;
  public readonly practiceId: Practice["id"];

  constructor(patientIdentityId: HashedRsaId, practiceId: Practice["id"]) {
    this.patientIdentityId = patientIdentityId;
    this.practiceId = practiceId;
  }
}

/**
 * A persisted link between a patient (hashed identity) and a practice.
 */
export class PatientPractice {
  constructor(
    public readonly id: string,
    public readonly patientIdentityId: HashedRsaId,
    public readonly practiceId: Practice["id"],
    public readonly createdAt: Date,
  ) {}
}
