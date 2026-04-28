import { Encrypter } from "~/modules/registration/domain/ports/encrypter";
import { HashedRsaId } from "~/modules/registration/domain/value-objects/hashed-rsaid";
import {
	ContactDetails,
	MedicalAidDetails,
	MedicalHistory,
	PersonalInformation
} from "~/modules/registration/domain/value-objects";
import {
	DecryptedPatientProfile,
	PersistedPatientProfileRow,
	RawPatientProfileParams,
	decryptProfileVOs,
	encryptPatientProfile,
	profileVOsFromRow,
} from "~/modules/registration/domain/entities/patient-profile.helpers";

/**
 * Baseline fields copied from {@link PatientIdentity} when the patient first
 * verifies a registration link. Residential address is filled when a
 * registration is approved with submitted data.
 */
export class DraftPatientRecord {
	constructor(
		public readonly patientIdentityId: HashedRsaId,
		public readonly contactDetails: ContactDetails,
		public readonly personalInformation: PersonalInformation,
		public readonly medicalAidDetails: MedicalAidDetails,
		public readonly medicalHistory: MedicalHistory,
	) {}

	static async fromRaw(
		params: RawPatientProfileParams & { patientIdentityId: HashedRsaId },
		encrypter: Encrypter,
	): Promise<DraftPatientRecord> {
		const vos = await encryptPatientProfile(params, encrypter);
		return new DraftPatientRecord(
			params.patientIdentityId,
			vos.contactDetails,
			vos.personalInformation,
			vos.medicalAidDetails,
			vos.medicalHistory,
		);
	}

	toPersisted() {
		return {
			patientIdentityId: this.patientIdentityId.toString(),
			contactDetails: this.contactDetails.toPersisted(),
			personalInformation: this.personalInformation.toPersisted(),
			medicalAidDetails: this.medicalAidDetails.toPersisted(),
			medicalHistory: this.medicalHistory.toPersisted(),
		};
	}
}

/**
 * Full contact profile applied to the canonical record on staff approval.
 */
export class UpdatePatientRecord {
	constructor(
		public readonly contactDetails: ContactDetails,
		public readonly personalInformation: PersonalInformation,
		public readonly medicalAidDetails: MedicalAidDetails,
		public readonly medicalHistory: MedicalHistory,
	) {}

	static async fromRaw(
		params: RawPatientProfileParams,
		encrypter: Encrypter,
	): Promise<UpdatePatientRecord> {
		const vos = await encryptPatientProfile(params, encrypter);
		return new UpdatePatientRecord(
			vos.contactDetails,
			vos.personalInformation,
			vos.medicalAidDetails,
			vos.medicalHistory,
		);
	}

	toPersisted() {
		return {
			contactDetails: this.contactDetails.toPersisted(),
			personalInformation: this.personalInformation.toPersisted(),
			medicalAidDetails: this.medicalAidDetails.toPersisted(),
			medicalHistory: this.medicalHistory.toPersisted(),
		};
	}
}

/**
 * Decrypted patient profile stored in the canonical `patient_records` table.
 * Identity (hashed RSA id) remains the stable key; this aggregate is mutable.
 */
export class PatientRecord {
	constructor(
		public readonly id: string,
		public readonly patientIdentityId: HashedRsaId,
		public readonly contactDetails: ContactDetails,
		public readonly personalInformation: PersonalInformation,
		public readonly medicalAidDetails: MedicalAidDetails,
		public readonly medicalHistory: MedicalHistory,
		public readonly updatedAt: Date,
	) {}

	static fromPersisted(row: PersistedPatientProfileRow & {
		id: string;
		patientIdentityId: string;
		updatedAt: Date;
	}): PatientRecord {
		const vos = profileVOsFromRow(row);
		return new PatientRecord(
			row.id,
			HashedRsaId.fromPersisted(row.patientIdentityId),
			vos.contactDetails,
			vos.personalInformation,
			vos.medicalAidDetails,
			vos.medicalHistory,
			row.updatedAt,
		);
	}

	async decrypt(encrypter: Encrypter): Promise<DecryptedPatientProfile & {
		id: string;
		patientIdentityId: string;
		updatedAt: Date;
	}> {
		const profile = await decryptProfileVOs(this, encrypter);
		return {
			id: this.id,
			patientIdentityId: this.patientIdentityId.toString(),
			contactDetails: { ...profile.contactDetails },
			medicalAidDetails: { ...profile.medicalAidDetails },
			medicalHistory: { ...profile.medicalHistory },
			personalInformation: { ...profile.personalInformation },
			updatedAt: this.updatedAt,
		};
	}
}
