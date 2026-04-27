import { Encrypter } from "~/modules/registration/domain/ports/encrypter";
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

	static fromPersisted(params: {
		firstname?: string;
		lastname?: string;
		/** Stored ciphertext for the date-of-birth field. */
		dateOfBirth?: string;
		gender?: string;
	}): PersonalInformation {
		return this.create({
			firstname: params.firstname ? EncryptedValue.fromPersisted(params.firstname) : undefined,
			lastname: params.lastname ? EncryptedValue.fromPersisted(params.lastname) : undefined,
			dateOfBirth: params.dateOfBirth
				? EncryptedValue.fromPersisted(params.dateOfBirth, IsoDate.fromSerialized)
				: undefined,
			gender: params.gender ? Gender.fromPersisted(params.gender) : undefined,
		});
	}

	static async fromRaw(
		params: {
			firstname?: string;
			lastname?: string;
			/** ISO-8601 date string, e.g. `YYYY-MM-DD` or full offset form. */
			dateOfBirth?: string;
			gender?: string;
		},
		encrypter: Encrypter,
	): Promise<PersonalInformation> {
		const [firstname, lastname, dateOfBirth] = await Promise.all([
			params.firstname ? EncryptedValue.create(params.firstname.trim(), encrypter) : undefined,
			params.lastname ? EncryptedValue.create(params.lastname.trim(), encrypter) : undefined,
			params.dateOfBirth
				? EncryptedValue.create(IsoDate.fromSerialized(params.dateOfBirth.trim()), encrypter, IsoDate.fromSerialized)
				: undefined,
		]);
		return this.create({
			firstname,
			lastname,
			dateOfBirth,
			gender: params.gender ? Gender.create(params.gender) : undefined,
		});
	}

	toPersisted(): {
		firstname?: string;
		lastname?: string;
		dateOfBirth?: string;
		gender?: string;
	} {
		return {
			firstname: this.firstname?.toPersisted(),
			lastname: this.lastname?.toPersisted(),
			dateOfBirth: this.dateOfBirth?.toPersisted(),
			gender: this.gender?.toString(),
		};
	}

	async decrypt(encrypter: Encrypter): Promise<{
		firstname?: string;
		lastname?: string;
		/** Serialized ISO-8601 date string. */
		dateOfBirth?: string;
		gender?: string;
	}> {
		const [firstname, lastname, dateOfBirth] = await Promise.all([
			this.firstname?.decrypt(encrypter),
			this.lastname?.decrypt(encrypter),
			this.dateOfBirth?.decrypt(encrypter),
		]);
		return {
			firstname,
			lastname,
			dateOfBirth: dateOfBirth?.serialize(),
			gender: this.gender?.toString(),
		};
	}
}
