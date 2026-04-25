import { HashedRsaId } from "../value-objects/hashed-rsaid";
import { RegistrationLinkStatus } from "../value-objects/registration-link-status";

export class RegistrationLink {
    constructor(
        public readonly id: string,
        public readonly status: RegistrationLinkStatus,
        public readonly expiresAt: Date,
        public readonly patient: HashedRsaId,
    ) {};

    public static create(
        id: string,
        expiresAt: Date,
        patient: HashedRsaId,
    ) {
        return new RegistrationLink(id, RegistrationLinkStatus.active(), expiresAt, patient);
    }
}