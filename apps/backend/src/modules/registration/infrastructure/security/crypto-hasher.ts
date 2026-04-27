import { env } from "~/config/env";
import { Hasher } from "~/modules/registration/domain/ports/hasher";
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
