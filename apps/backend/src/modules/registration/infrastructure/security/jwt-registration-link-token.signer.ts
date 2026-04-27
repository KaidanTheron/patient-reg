import { Injectable } from "@nestjs/common";
import { sign, verify, type Secret } from "jsonwebtoken";
import { env } from "~/config/env";
import {
  RegistrationLinkTokenPayload,
  RegistrationLinkTokenSigner,
} from "~/modules/registration/domain/ports/registration-link-token.signer";

type JwtBody = { registrationLinkId: string; exp: number; iat: number };

@Injectable()
export class JwtRegistrationLinkTokenSigner extends RegistrationLinkTokenSigner {
  private readonly secret: Secret = env.SECRET;

  sign(params: { registrationLinkId: string; expiresAt: Date }): string {
    const expiresInSeconds = Math.max(
      1,
      Math.floor((params.expiresAt.getTime() - Date.now()) / 1000),
    );
    return sign(
      { registrationLinkId: params.registrationLinkId },
      this.secret,
      {
        expiresIn: expiresInSeconds,
      },
    );
  }

  verify(token: string): RegistrationLinkTokenPayload {
    const decoded = verify(token, this.secret) as JwtBody;
    if (!decoded.registrationLinkId) {
      throw new Error("Invalid token payload");
    }
    return { registrationLinkId: decoded.registrationLinkId };
  }
}
