import { Encrypter } from "~/modules/registration/domain/ports/encrypter";
import { HashedRsaId } from "~/modules/registration/domain/value-objects/hashed-rsaid";
import { RegistrationRequest } from "~/modules/registration/domain/entities/registration-request.entity";
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

export class DraftRegistrationDocument {
	constructor(
		public readonly registrationRequestId: RegistrationRequest["id"],
		public readonly patientIdentityId: HashedRsaId,
		public readonly contactDetails: ContactDetails,
		public readonly personalInformation: PersonalInformation,
		public readonly medicalAidDetails: MedicalAidDetails,
		public readonly medicalHistory: MedicalHistory,
	) {}

	static async fromRaw(
		params: RawPatientProfileParams & {
			registrationRequestId: string;
			patientIdentityId: HashedRsaId;
		},
		encrypter: Encrypter,
	): Promise<DraftRegistrationDocument> {
		const vos = await encryptPatientProfile(params, encrypter);
		return new DraftRegistrationDocument(
			params.registrationRequestId,
			params.patientIdentityId,
			vos.contactDetails,
			vos.personalInformation,
			vos.medicalAidDetails,
			vos.medicalHistory,
		);
	}

	toPersisted() {
		return {
			registrationRequestId: this.registrationRequestId,
			patientIdentityId: this.patientIdentityId.toString(),
			contactDetails: this.contactDetails.toPersisted(),
			personalInformation: this.personalInformation.toPersisted(),
			medicalAidDetails: this.medicalAidDetails.toPersisted(),
			medicalHistory: this.medicalHistory.toPersisted(),
		};
	}
}

export class UpdateRegistrationDocument {
	constructor(
		public readonly contactDetails: ContactDetails,
		public readonly personalInformation: PersonalInformation,
		public readonly medicalAidDetails: MedicalAidDetails,
		public readonly medicalHistory: MedicalHistory,
		public readonly submittedAt: Date,
	) {}

	static async fromRaw(
		params: RawPatientProfileParams & { submittedAt: Date },
		encrypter: Encrypter,
	): Promise<UpdateRegistrationDocument> {
		const vos = await encryptPatientProfile(params, encrypter);
		return new UpdateRegistrationDocument(
			vos.contactDetails,
			vos.personalInformation,
			vos.medicalAidDetails,
			vos.medicalHistory,
			params.submittedAt,
		);
	}

	toPersisted() {
		return {
			contactDetails: this.contactDetails.toPersisted(),
			personalInformation: this.personalInformation.toPersisted(),
			medicalAidDetails: this.medicalAidDetails.toPersisted(),
			medicalHistory: this.medicalHistory.toPersisted(),
			submittedAt: this.submittedAt,
		};
	}
}

export class RegistrationDocument {
	constructor(
		public readonly id: string,
		public readonly registrationRequestId: RegistrationRequest["id"],
		public readonly patientIdentityId: HashedRsaId,
		public readonly contactDetails: ContactDetails,
		public readonly personalInformation: PersonalInformation,
		public readonly medicalAidDetails: MedicalAidDetails,
		public readonly medicalHistory: MedicalHistory,
		public readonly submittedAt: Date,
	) {}

	static fromPersisted(row: PersistedPatientProfileRow & {
		id: string;
		registrationRequestId: string;
		patientIdentityId: string;
		submittedAt: Date;
	}): RegistrationDocument {
		const vos = profileVOsFromRow(row);
		return new RegistrationDocument(
			row.id,
			row.registrationRequestId,
			HashedRsaId.fromPersisted(row.patientIdentityId),
			vos.contactDetails,
			vos.personalInformation,
			vos.medicalAidDetails,
			vos.medicalHistory,
			row.submittedAt,
		);
	}

	async decrypt(encrypter: Encrypter): Promise<DecryptedPatientProfile & {
		id: string;
		registrationRequestId: string;
		patientIdentityId: string;
		submittedAt: Date;
	}> {
		const profile = await decryptProfileVOs(this, encrypter);
		return {
			id: this.id,
			registrationRequestId: this.registrationRequestId,
			patientIdentityId: this.patientIdentityId.toString(),
			...profile,
			submittedAt: this.submittedAt,
		};
	}
}
