import { Injectable } from "@nestjs/common";
import jwt from "jsonwebtoken";
import { env } from "../../../config/env";
import { AuthLinkTokenSigner } from "../domain/ports/auth-link-token.signer";

@Injectable()
export class JwtAuthLinkTokenSigner extends AuthLinkTokenSigner {
  sign(linkUuid: string, expiresAt: Date): string {
    const expiresInSeconds = Math.max(
      1,
      Math.floor((expiresAt.getTime() - Date.now()) / 1000),
    );
    return jwt.sign({}, env.SECRET, {
      algorithm: "HS256",
      subject: linkUuid,
      expiresIn: expiresInSeconds,
    });
  }

  verify(token: string): { linkUuid: string } {
    const payload = jwt.verify(token, env.SECRET, {
      algorithms: ["HS256"],
    }) as jwt.JwtPayload;
    if (typeof payload.sub !== "string") {
      throw new jwt.JsonWebTokenError("Missing subject on auth link token");
    }
    return { linkUuid: payload.sub };
  }
}
