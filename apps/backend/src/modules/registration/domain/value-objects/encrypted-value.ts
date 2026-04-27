import { Encrypter } from "~/modules/registration/domain/ports/encrypter";

export class EncryptedValue {
  private constructor(private readonly ciphertext: string) {}

  public static async create(
    value: string,
    encrypter: Encrypter,
  ): Promise<EncryptedValue> {
    const ciphertext = await encrypter.encrypt(value);
    if (!ciphertext) {
      throw new Error("Encryption produced an empty ciphertext");
    }
    return new EncryptedValue(ciphertext);
  }

  public static fromPersisted(ciphertext: string): EncryptedValue {
    if (!ciphertext) {
      throw new Error("Encrypted value cannot be empty");
    }
    return new EncryptedValue(ciphertext);
  }

  public decrypt(encrypter: Encrypter): Promise<string> {
    return encrypter.decrypt(this.ciphertext);
  }

  public equals(other: EncryptedValue): boolean {
    return this.ciphertext === other.ciphertext;
  }

  /**
   * Raw ciphertext for persistence layers only.
   */
  public toPersisted(): string {
    return this.ciphertext;
  }
}
