export const genderValues = ["MALE", "FEMALE"] as const;

export type GenderValue = (typeof genderValues)[number];

export class Gender {
	private constructor(public readonly value: GenderValue) {}

	static create(value: string): Gender {
		if (!genderValues.includes(value as GenderValue)) {
			throw new Error(`Unknown gender value: ${value}`);
		}
		return new Gender(value as GenderValue);
	}

	static fromPersisted(value: string): Gender {
		return Gender.create(value);
	}

	toString(): string {
		return this.value;
	}
}
