import { Encrypter } from "~/modules/registration/domain/ports/encrypter";

export type Plaintext = string | { serialize(): string };

/**
 * An encrypted field value. `T` is the plaintext domain type — either `string`
 * (the default, zero-config) or any object that can round-trip through a UTF-8
 * string via `instance.serialize()` / a `revive` factory.
 *
 * For string fields nothing at call-sites changes (`T` defaults to `string`).
 * For typed value objects (e.g. `IsoDate`) pass the static factory as `revive`:
 *
 *   EncryptedValue.create(isoDate, encrypter, IsoDate.fromSerialized)
 *   // decrypt returns Promise<IsoDate>
 */
export class EncryptedValue<T extends Plaintext = string> {
	private constructor(
		private readonly ciphertext: string,
		private readonly revive: (plain: string) => T,
	) {}

	// --- string overload (no revive needed) ---
	public static async create(
		value: string,
		encrypter: Encrypter,
	): Promise<EncryptedValue<string>>;

	// --- typed VO overload ---
	public static async create<T extends { serialize(): string }>(
		value: T,
		encrypter: Encrypter,
		revive: (plain: string) => T,
	): Promise<EncryptedValue<T>>;

	public static async create(
		value: string | { serialize(): string },
		encrypter: Encrypter,
		revive?: (plain: string) => Plaintext,
	): Promise<EncryptedValue<any>> {
		const plain = typeof value === "string" ? value : value.serialize();
		const ciphertext = await encrypter.encrypt(plain);
		if (!ciphertext) {
			throw new Error("Encryption produced an empty ciphertext");
		}
		const r = revive ?? ((s: string) => s);
		return new EncryptedValue(ciphertext, r);
	}

	// --- string overload ---
	public static fromPersisted(ciphertext: string): EncryptedValue<string>;

	// --- typed VO overload ---
	public static fromPersisted<T extends { serialize(): string }>(
		ciphertext: string,
		revive: (plain: string) => T,
	): EncryptedValue<T>;

	public static fromPersisted(
		ciphertext: string,
		revive?: (plain: string) => Plaintext,
	): EncryptedValue<any> {
		if (!ciphertext) {
			throw new Error("Encrypted value cannot be empty");
		}
		const r = revive ?? ((s: string) => s);
		return new EncryptedValue(ciphertext, r);
	}

	/** Decrypts and revives the plaintext value as `T`. */
	public async decrypt(encrypter: Encrypter): Promise<T> {
		const plain = await encrypter.decrypt(this.ciphertext);
		return this.revive(plain);
	}

	public equals(other: EncryptedValue<T>): boolean {
		return this.ciphertext === other.ciphertext;
	}

	/** Raw ciphertext for persistence layers only. */
	public toPersisted(): string {
		return this.ciphertext;
	}
}
