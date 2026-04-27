import { Encrypter } from "~/modules/registration/domain/ports/encrypter";
import { EncryptedValue } from "./encrypted-value";

export class ContactDetails {
	private constructor(
		public readonly phone: EncryptedValue | undefined,
		public readonly altphone: EncryptedValue | undefined,
		public readonly email: EncryptedValue | undefined,
		public readonly address: EncryptedValue | undefined,
	) {}

	static create(
		params: {
			phone?: EncryptedValue;
			altphone?: EncryptedValue;
			email?: EncryptedValue;
			address?: EncryptedValue;
		}
	) {
		const { address, altphone, email, phone } = params;

		if (!phone && !email) {
			throw new Error("At least one of phone or email must be provided");
		}

		return new ContactDetails(phone, altphone, email, address);
	}

	static fromPersisted(params: {
		phone?: string;
		altphone?: string;
		email?: string;
		address?: string;
	}): ContactDetails {
		return this.create({
			phone: params.phone ? EncryptedValue.fromPersisted(params.phone) : undefined,
			altphone: params.altphone ? EncryptedValue.fromPersisted(params.altphone) : undefined,
			email: params.email ? EncryptedValue.fromPersisted(params.email) : undefined,
			address: params.address ? EncryptedValue.fromPersisted(params.address) : undefined,
		});
	}

	static async fromRaw(
		params: {
			phone?: string;
			altphone?: string;
			email?: string;
			address?: string;
		},
		encrypter: Encrypter,
	) {
		const [phone, altphone, email, address] = await Promise.all([
			params.phone ? EncryptedValue.create(params.phone.trim(), encrypter) : undefined,
			params.altphone ? EncryptedValue.create(params.altphone.trim(), encrypter) : undefined,
			params.email ? EncryptedValue.create(params.email.trim(), encrypter) : undefined,
			params.address ? EncryptedValue.create(params.address.trim(), encrypter) : undefined,
		]);

		return this.create({ phone, altphone, email, address });
	}

	toPersisted(): {
		phone?: string;
		altphone?: string;
		email?: string;
		address?: string;
	} {
		return {
			phone: this.phone?.toPersisted(),
			altphone: this.altphone?.toPersisted(),
			email: this.email?.toPersisted(),
			address: this.address?.toPersisted(),
		};
	}

	async decrypt(encrypter: Encrypter): Promise<{
		phone?: string;
		altphone?: string;
		email?: string;
		address?: string;
	}> {
		const [phone, altphone, email, address] = await Promise.all([
			this.phone?.decrypt(encrypter),
			this.altphone?.decrypt(encrypter),
			this.email?.decrypt(encrypter),
			this.address?.decrypt(encrypter),
		]);
		return { phone, altphone, email, address };
	}
}
