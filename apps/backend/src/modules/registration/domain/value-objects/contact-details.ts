import { Encrypter } from "../ports/encrypter";
import { EncryptedValue } from "./encrypted-value";

export class ContactDetails {
  private constructor(
    public readonly phone: EncryptedValue | undefined,
    public readonly altphone: EncryptedValue | undefined,
    public readonly email: EncryptedValue | undefined,
    public readonly address: EncryptedValue,
  ) {}

  static async fromRaw(
    params: {
      phone?: string;
      altphone?: string;
      email?: string;
      address: string;
    },
    encrypter: Encrypter,
  ) {
    const { address, altphone, email, phone } = params;
    if (!email && !phone) {
      throw new Error("At least one of email or phone should be supplied");
    }

    const [$phone, $altphone, $email, $address] = await Promise.all([
        phone ? EncryptedValue.create(phone, encrypter) : undefined,
        altphone ? EncryptedValue.create(altphone, encrypter) : undefined,
        email ? EncryptedValue.create(email, encrypter) : undefined,
        EncryptedValue.create(address, encrypter),
    ]);

    return new ContactDetails(
        $phone,
        $altphone,
        $email,
        $address
    );
  }
}