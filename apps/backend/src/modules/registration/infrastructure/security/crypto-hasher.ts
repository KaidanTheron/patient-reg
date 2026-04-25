import { env } from "src/config/env";
import { Hasher } from "../../domain/ports/hasher";
import crypto from "crypto";

export class CryptoHasher extends Hasher {
    hash(rawValue: string): Promise<string> {
        const hashedValue = crypto
            .createHmac("sha256", env.SECRET)
            .update(rawValue)
            .digest()
            .toString();

        return new Promise((resolve) => resolve(hashedValue));
    }
}