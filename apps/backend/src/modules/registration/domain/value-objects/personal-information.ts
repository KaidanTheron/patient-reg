import { EncryptedValue } from "./encrypted-value";
import { IsoDate } from "./iso-date";
import { Gender } from "./gender";

export class PersonalInformation {
	private constructor(
		public readonly firstname?: EncryptedValue,
		public readonly lastname?: EncryptedValue,
		public readonly dateOfBirth?: EncryptedValue<IsoDate>,
		public readonly gender?: Gender,
	) {}

	static create(params: {
		firstname?: EncryptedValue;
		lastname?: EncryptedValue;
		dateOfBirth?: EncryptedValue<IsoDate>;
		gender?: Gender;
	}): PersonalInformation {
		return new PersonalInformation(
			params.firstname,
			params.lastname,
			params.dateOfBirth,
			params.gender,
		);
	}
}
