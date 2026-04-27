import crypto from "crypto";
import { env } from "~/config/env";
import { Encrypter } from "~/modules/registration/domain/ports/encrypter";

const ALGORITHM: crypto.CipherGCMTypes = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const VERSION_PREFIX = "v1:";

const encryptionKey = buildEncryptionKey();

function buildEncryptionKey(): Buffer {
  return crypto
    .createHash("sha256")
    .update("patient-reg:encrypter:aes-256-gcm", "utf8")
    .update(env.SECRET, "utf8")
    .digest();
}

/**
 * App-level field encryption: AES-256-GCM with random IV, format `v1:` + base64url bytes (iv|tag|cipher).
 * Plaintext is UTF-8 text only (e.g. email, phone); no JSON wrapping.
 */
export class CryptoEncrypter extends Encrypter {
  encrypt(plaintext: string): Promise<string> {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, encryptionKey, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });
    const ciphertext = Buffer.concat([
      cipher.update(plaintext, "utf8"),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    const raw = Buffer.concat([iv, tag, ciphertext]);
    return Promise.resolve(VERSION_PREFIX + raw.toString("base64url"));
  }

  decrypt(ciphertext: string): Promise<string> {
    if (!ciphertext.startsWith(VERSION_PREFIX)) {
      throw new Error("Ciphertext is missing a supported version prefix");
    }
    const b64 = ciphertext.slice(VERSION_PREFIX.length);
    const raw = Buffer.from(b64, "base64url");
    if (raw.length < IV_LENGTH + AUTH_TAG_LENGTH + 1) {
      throw new Error("Ciphertext is too short");
    }
    const iv = raw.subarray(0, IV_LENGTH);
    const tag = raw.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const enc = raw.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
    const decipher = crypto.createDecipheriv(ALGORITHM, encryptionKey, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([
      decipher.update(enc),
      decipher.final(),
    ]).toString("utf8");
    return Promise.resolve(plaintext);
  }
}
