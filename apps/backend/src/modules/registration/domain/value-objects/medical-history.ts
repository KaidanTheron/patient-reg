import { EncryptedValue } from "~/modules/registration/domain/value-objects/encrypted-value";

/**
 * Patient medical history submitted as part of a registration document.
 * All fields are encrypted at rest; any may be absent if the patient has nothing to declare.
 */
export class MedicalHistory {
	private constructor(
		public readonly allergies: EncryptedValue | undefined,
		public readonly currentMedication: EncryptedValue | undefined,
		public readonly chronicConditions: EncryptedValue | undefined,
		public readonly previousSurgeries: EncryptedValue | undefined,
		public readonly familyHistory: EncryptedValue | undefined,
	) {}

	static create(params: {
		allergies?: EncryptedValue;
		currentMedication?: EncryptedValue;
		chronicConditions?: EncryptedValue;
		previousSurgeries?: EncryptedValue;
		familyHistory?: EncryptedValue;
	}): MedicalHistory {
		return new MedicalHistory(
			params.allergies,
			params.currentMedication,
			params.chronicConditions,
			params.previousSurgeries,
			params.familyHistory,
		);
	}
}
