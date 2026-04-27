export const medicalAidSchemeValues = [
	"DISCOVERY_HEALTH",
	"MOMENTUM_HEALTH",
	"BONITAS",
	"MEDSHIELD",
	"FEDHEALTH",
	"GEMS",
	"BESTMED",
	"MEDIHELP",
	"COMPCARE",
	"OTHER",
] as const;

export type MedicalAidSchemeValue = (typeof medicalAidSchemeValues)[number];

export class MedicalAidScheme {
	private constructor(public readonly value: MedicalAidSchemeValue) {}

	static create(value: MedicalAidSchemeValue): MedicalAidScheme {
		return new MedicalAidScheme(value);
	}

	static fromPersisted(value: string): MedicalAidScheme {
		if (!medicalAidSchemeValues.includes(value as MedicalAidSchemeValue)) {
			throw new Error(`Unknown medical aid scheme: ${value}`);
		}
		return new MedicalAidScheme(value as MedicalAidSchemeValue);
	}

	toString(): string {
		return this.value;
	}
}
