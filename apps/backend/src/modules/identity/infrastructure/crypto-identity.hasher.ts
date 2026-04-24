import { Injectable } from "@nestjs/common";
import { IdentityHasher } from "../domain/ports/identity.hasher";
import crypto from "crypto";

@Injectable()
export class CryptoIdentityHasher extends IdentityHasher {
    hash(id: string): Promise<string> {
        const hasher = crypto.createHash("sha256");
        hasher.update(id);

        return new Promise((resolve) => resolve(hasher.digest("hex")));
    }
}