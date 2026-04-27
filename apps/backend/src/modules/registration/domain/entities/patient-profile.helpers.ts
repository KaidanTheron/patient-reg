import { Encrypter } from "~/modules/registration/domain/ports/encrypter";
import {
	ContactDetails,
	MedicalAidDetails,
	MedicalHistory,
	PersonalInformation,
} from "~/modules/registration/domain/value-objects";

export type RawPatientProfileParams = {
	contactDetails: { email?: string; phone?: string; altphone?: string; address?: string };
	personalInformation: { firstname?: string; lastname?: string; dateOfBirth?: string; gender?: string };
	medicalAidDetails: { scheme?: string; memberNumber?: string; mainMember?: string; mainMemberId?: string; dependantCode?: string };
	medicalHistory: { allergies?: string; currentMedication?: string; chronicConditions?: string; previousSurgeries?: string; familyHistory?: string };
};

export type PatientProfileVOs = {
	contactDetails: ContactDetails;
	personalInformation: PersonalInformation;
	medicalAidDetails: MedicalAidDetails;
	medicalHistory: MedicalHistory;
};

export type PersistedPatientProfileRow = {
	email: string | null;
	phoneNumber: string | null;
	altphone: string | null;
	residentialAddress: string | null;
	firstname: string | null;
	lastname: string | null;
	dateOfBirth: string | null;
	gender: string | null;
	scheme: string | null;
	memberNumber: string | null;
	mainMember: string | null;
	mainMemberId: string | null;
	dependantCode: string | null;
	allergies: string | null;
	currentMedication: string | null;
	chronicConditions: string | null;
	previousSurgeries: string | null;
	familyHistory: string | null;
};

export type DecryptedPatientProfile = {
	contactDetails: { email?: string; phone?: string; altphone?: string; address?: string };
	personalInformation: { firstname?: string; lastname?: string; dateOfBirth?: string; gender?: string };
	medicalAidDetails: { scheme?: string; memberNumber?: string; mainMember?: string; mainMemberId?: string; dependantCode?: string };
	medicalHistory: { allergies?: string; currentMedication?: string; chronicConditions?: string; previousSurgeries?: string; familyHistory?: string };
};

export async function encryptPatientProfile(
	params: RawPatientProfileParams,
	encrypter: Encrypter,
): Promise<PatientProfileVOs> {
	const [contactDetails, personalInformation, medicalAidDetails, medicalHistory] =
		await Promise.all([
			ContactDetails.fromRaw(params.contactDetails, encrypter),
			PersonalInformation.fromRaw(params.personalInformation, encrypter),
			MedicalAidDetails.fromRaw(params.medicalAidDetails, encrypter),
			MedicalHistory.fromRaw(params.medicalHistory, encrypter),
		]);
	return { contactDetails, personalInformation, medicalAidDetails, medicalHistory };
}

export function profileVOsFromRow(row: PersistedPatientProfileRow): PatientProfileVOs {
	return {
		contactDetails: ContactDetails.fromPersisted({
			email: row.email ?? undefined,
			phone: row.phoneNumber ?? undefined,
			altphone: row.altphone ?? undefined,
			address: row.residentialAddress ?? undefined,
		}),
		personalInformation: PersonalInformation.fromPersisted({
			firstname: row.firstname ?? undefined,
			lastname: row.lastname ?? undefined,
			dateOfBirth: row.dateOfBirth ?? undefined,
			gender: row.gender ?? undefined,
		}),
		medicalAidDetails: MedicalAidDetails.fromPersisted({
			scheme: row.scheme ?? undefined,
			memberNumber: row.memberNumber ?? undefined,
			mainMember: row.mainMember ?? undefined,
			mainMemberId: row.mainMemberId ?? undefined,
			dependantCode: row.dependantCode ?? undefined,
		}),
		medicalHistory: MedicalHistory.fromPersisted({
			allergies: row.allergies ?? undefined,
			currentMedication: row.currentMedication ?? undefined,
			chronicConditions: row.chronicConditions ?? undefined,
			previousSurgeries: row.previousSurgeries ?? undefined,
			familyHistory: row.familyHistory ?? undefined,
		}),
	};
}

export async function decryptProfileVOs(
	vos: PatientProfileVOs,
	encrypter: Encrypter,
): Promise<DecryptedPatientProfile> {
	const [contactDetails, personalInformation, medicalAidDetails, medicalHistory] =
		await Promise.all([
			vos.contactDetails.decrypt(encrypter),
			vos.personalInformation.decrypt(encrypter),
			vos.medicalAidDetails.decrypt(encrypter),
			vos.medicalHistory.decrypt(encrypter),
		]);
	return { contactDetails, personalInformation, medicalAidDetails, medicalHistory };
}
