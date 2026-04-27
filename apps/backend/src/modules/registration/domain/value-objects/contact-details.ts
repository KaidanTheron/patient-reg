import { EncryptedValue } from "./encrypted-value";

export class ContactDetails {
    private constructor(
        public readonly phone: EncryptedValue | undefined,
        public readonly altphone: EncryptedValue | undefined,
        public readonly email: EncryptedValue | undefined,
        public readonly address: EncryptedValue | undefined,
    ) {};

    static create(params: {
        phone?: EncryptedValue;
        altphone?: EncryptedValue;
        email?: EncryptedValue;
        address?: EncryptedValue;
    }) {
        const {
            address,
            altphone,
            email,
            phone,
        } = params;

        if (!phone && !email) {
            throw new Error("At least one of phone or email must be provided");
        }

        return new ContactDetails(phone, altphone, email, address);
    };
}