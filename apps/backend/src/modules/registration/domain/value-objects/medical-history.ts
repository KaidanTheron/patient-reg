import { Encrypter } from "~/modules/registration/domain/ports/encrypter";
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

	static fromPersisted(params: {
		allergies?: string;
		currentMedication?: string;
		chronicConditions?: string;
		previousSurgeries?: string;
		familyHistory?: string;
	}): MedicalHistory {
		return this.create({
			allergies: params.allergies ? EncryptedValue.fromPersisted(params.allergies) : undefined,
			currentMedication: params.currentMedication ? EncryptedValue.fromPersisted(params.currentMedication) : undefined,
			chronicConditions: params.chronicConditions ? EncryptedValue.fromPersisted(params.chronicConditions) : undefined,
			previousSurgeries: params.previousSurgeries ? EncryptedValue.fromPersisted(params.previousSurgeries) : undefined,
			familyHistory: params.familyHistory ? EncryptedValue.fromPersisted(params.familyHistory) : undefined,
		});
	}

	static async fromRaw(
		params: {
			allergies?: string;
			currentMedication?: string;
			chronicConditions?: string;
			previousSurgeries?: string;
			familyHistory?: string;
		},
		encrypter: Encrypter,
	): Promise<MedicalHistory> {
		const [allergies, currentMedication, chronicConditions, previousSurgeries, familyHistory] =
			await Promise.all([
				params.allergies ? EncryptedValue.create(params.allergies.trim(), encrypter) : undefined,
				params.currentMedication ? EncryptedValue.create(params.currentMedication.trim(), encrypter) : undefined,
				params.chronicConditions ? EncryptedValue.create(params.chronicConditions.trim(), encrypter) : undefined,
				params.previousSurgeries ? EncryptedValue.create(params.previousSurgeries.trim(), encrypter) : undefined,
				params.familyHistory ? EncryptedValue.create(params.familyHistory.trim(), encrypter) : undefined,
			]);
		return this.create({ allergies, currentMedication, chronicConditions, previousSurgeries, familyHistory });
	}

	toPersisted(): {
		allergies?: string;
		currentMedication?: string;
		chronicConditions?: string;
		previousSurgeries?: string;
		familyHistory?: string;
	} {
		return {
			allergies: this.allergies?.toPersisted(),
			currentMedication: this.currentMedication?.toPersisted(),
			chronicConditions: this.chronicConditions?.toPersisted(),
			previousSurgeries: this.previousSurgeries?.toPersisted(),
			familyHistory: this.familyHistory?.toPersisted(),
		};
	}

	async decrypt(encrypter: Encrypter): Promise<{
		allergies?: string;
		currentMedication?: string;
		chronicConditions?: string;
		previousSurgeries?: string;
		familyHistory?: string;
	}> {
		const [allergies, currentMedication, chronicConditions, previousSurgeries, familyHistory] =
			await Promise.all([
				this.allergies?.decrypt(encrypter),
				this.currentMedication?.decrypt(encrypter),
				this.chronicConditions?.decrypt(encrypter),
				this.previousSurgeries?.decrypt(encrypter),
				this.familyHistory?.decrypt(encrypter),
			]);
		return { allergies, currentMedication, chronicConditions, previousSurgeries, familyHistory };
	}
}
