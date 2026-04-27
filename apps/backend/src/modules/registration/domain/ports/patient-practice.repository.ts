import {
  DraftPatientPractice,
  PatientPractice,
} from "~/modules/registration/domain/entities/patient-practice.entity";

export abstract class PatientPracticeRepository {
  /**
   * Ensures a row exists for the patient and practice. If a link already
   * exists, returns the existing link without error (idempotent).
   */
  abstract ensureLinked(draft: DraftPatientPractice): Promise<PatientPractice>;
}
