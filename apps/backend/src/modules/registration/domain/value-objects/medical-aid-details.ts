import { EncryptedValue } from "~/modules/registration/domain/value-objects/encrypted-value";
import { MedicalAidScheme } from "./medical-aid-scheme";

/**
 * Medical aid cover details submitted as part of a registration document.
 * Fields containing personal identifiers are encrypted at rest.
 * All fields are optional — patients may not have medical aid.
 */
export class MedicalAidDetails {
	private constructor(
		public readonly scheme?: MedicalAidScheme,
		public readonly memberNumber?: EncryptedValue,
		public readonly mainMember?: EncryptedValue,
		public readonly mainMemberId?: EncryptedValue,
		public readonly dependantCode?: EncryptedValue,
	) {}

	static create(params: {
		scheme?: MedicalAidScheme;
		memberNumber?: EncryptedValue;
		mainMember?: EncryptedValue;
		mainMemberId?: EncryptedValue;
		dependantCode?: EncryptedValue;
	}): MedicalAidDetails {
		return new MedicalAidDetails(
			params.scheme,
			params.memberNumber,
			params.mainMember,
			params.mainMemberId,
			params.dependantCode,
		);
	}
}
