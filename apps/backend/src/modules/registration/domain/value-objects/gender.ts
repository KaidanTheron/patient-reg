export const genderValues = ["MALE", "FEMALE"] as const;

export type GenderValue = (typeof genderValues)[number];

export class Gender {
	private constructor(public readonly value: GenderValue) {}

	static create(value: GenderValue): Gender {
		return new Gender(value);
	}

	static fromPersisted(value: string): Gender {
		if (!genderValues.includes(value as GenderValue)) {
			throw new Error(`Unknown gender value: ${value}`);
		}
		return new Gender(value as GenderValue);
	}

	toString(): string {
		return this.value;
	}
}
