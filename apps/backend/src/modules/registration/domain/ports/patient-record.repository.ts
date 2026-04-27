import {
	DraftPatientRecord,
	PatientRecord,
	UpdatePatientRecord,
} from "~/modules/registration/domain/entities/patient-record.entity";

export abstract class PatientRecordRepository {
	abstract findByPatientIdentity(
		patientIdentityId: PatientRecord["patientIdentityId"],
	): Promise<PatientRecord | null>;

	/**
	 * Creates a row if none exists for this identity, copying baseline fields from
	 * the external identity read model. If a record already exists, returns it
	 * unchanged.
	 */
	abstract ensureFromIdentity(
		draft: DraftPatientRecord,
	): Promise<PatientRecord>;

	/**
	 * Overwrites all contact and health fields on the patient record (after staff
	 * approval of a submitted registration).
	 */
	abstract update(
		patientIdentityId: PatientRecord["patientIdentityId"],
		update: UpdatePatientRecord,
	): Promise<PatientRecord>;
}
