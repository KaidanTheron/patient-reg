import { Hasher } from "../ports/hasher";
import { RsaIdNumber } from "./rsaid";

export class HashedRsaId {
    private constructor(
        private readonly hashedValue: string,
    ) {};

    public static async create(
        rawValue: RsaIdNumber,
        hasher: Hasher,
    ): Promise<HashedRsaId> {
        const hashedValue = await hasher.hash(rawValue.toString());
        if (!hashedValue) {
            throw new Error("Hashed RSA ID cannot be empty");
        }
        return new HashedRsaId(hashedValue);
    }

    public static fromPersisted(hashedValue: string): HashedRsaId {
        if (!hashedValue) {
            throw new Error("Hashed RSA ID cannot be empty");
        }
        return new HashedRsaId(hashedValue);
    }

    public equals(other: HashedRsaId): boolean {
        return this.hashedValue === other.hashedValue;
    }

    public toString(): string {
        return this.hashedValue;
    }
}