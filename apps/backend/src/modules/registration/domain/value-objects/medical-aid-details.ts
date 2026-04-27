import { Encrypter } from "~/modules/registration/domain/ports/encrypter";
import { EncryptedValue } from "~/modules/registration/domain/value-objects/encrypted-value";
import { MedicalAidScheme } from "./medical-aid-scheme";
import { NonFunctionProperties } from "~/common/typing";

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

	static create(params: NonFunctionProperties<MedicalAidDetails>): MedicalAidDetails {
		return new MedicalAidDetails(
			params.scheme,
			params.memberNumber,
			params.mainMember,
			params.mainMemberId,
			params.dependantCode,
		);
	}

	static fromPersisted(params: {
		scheme?: string;
		memberNumber?: string;
		mainMember?: string;
		mainMemberId?: string;
		dependantCode?: string;
	}): MedicalAidDetails {
		return this.create({
			scheme: params.scheme ? MedicalAidScheme.fromPersisted(params.scheme) : undefined,
			memberNumber: params.memberNumber ? EncryptedValue.fromPersisted(params.memberNumber) : undefined,
			mainMember: params.mainMember ? EncryptedValue.fromPersisted(params.mainMember) : undefined,
			mainMemberId: params.mainMemberId ? EncryptedValue.fromPersisted(params.mainMemberId) : undefined,
			dependantCode: params.dependantCode ? EncryptedValue.fromPersisted(params.dependantCode) : undefined,
		});
	}

	static async fromRaw(
		params: {
			scheme?: string;
			memberNumber?: string;
			mainMember?: string;
			mainMemberId?: string;
			dependantCode?: string;
		},
		encrypter: Encrypter,
	): Promise<MedicalAidDetails> {
		const [memberNumber, mainMember, mainMemberId, dependantCode] = await Promise.all([
			params.memberNumber ? EncryptedValue.create(params.memberNumber.trim(), encrypter) : undefined,
			params.mainMember ? EncryptedValue.create(params.mainMember.trim(), encrypter) : undefined,
			params.mainMemberId ? EncryptedValue.create(params.mainMemberId.trim(), encrypter) : undefined,
			params.dependantCode ? EncryptedValue.create(params.dependantCode.trim(), encrypter) : undefined,
		]);
		return this.create({
			scheme: params.scheme ? MedicalAidScheme.create(params.scheme) : undefined,
			memberNumber,
			mainMember,
			mainMemberId,
			dependantCode,
		});
	}

	toPersisted(): {
		scheme?: string;
		memberNumber?: string;
		mainMember?: string;
		mainMemberId?: string;
		dependantCode?: string;
	} {
		return {
			scheme: this.scheme?.toString(),
			memberNumber: this.memberNumber?.toPersisted(),
			mainMember: this.mainMember?.toPersisted(),
			mainMemberId: this.mainMemberId?.toPersisted(),
			dependantCode: this.dependantCode?.toPersisted(),
		};
	}

	async decrypt(encrypter: Encrypter): Promise<{
		scheme?: string;
		memberNumber?: string;
		mainMember?: string;
		mainMemberId?: string;
		dependantCode?: string;
	}> {
		const [memberNumber, mainMember, mainMemberId, dependantCode] = await Promise.all([
			this.memberNumber?.decrypt(encrypter),
			this.mainMember?.decrypt(encrypter),
			this.mainMemberId?.decrypt(encrypter),
			this.dependantCode?.decrypt(encrypter),
		]);
		return {
			scheme: this.scheme?.toString(),
			memberNumber,
			mainMember,
			mainMemberId,
			dependantCode,
		};
	}
}
