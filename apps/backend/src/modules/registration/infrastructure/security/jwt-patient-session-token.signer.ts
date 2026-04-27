import { Injectable } from "@nestjs/common";
import { sign, verify, type Secret } from "jsonwebtoken";
import { env } from "~/config/env";
import {
  type PatientSessionTokenPayload,
  PATIENT_SESSION_TOKEN_TYPE,
  PatientSessionTokenSigner,
} from "~/modules/registration/domain/ports/patient-session-token.signer";

type JwtBody = {
  registrationLinkId: string;
  typ: string;
  exp: number;
  iat: number;
};

@Injectable()
export class JwtPatientSessionTokenSigner extends PatientSessionTokenSigner {
  private readonly secret: Secret = env.SECRET;

  sign(params: { registrationLinkId: string; expiresAt: Date }): string {
    const expiresInSeconds = Math.max(
      1,
      Math.floor((params.expiresAt.getTime() - Date.now()) / 1000),
    );
    return sign(
      {
        registrationLinkId: params.registrationLinkId,
        typ: PATIENT_SESSION_TOKEN_TYPE,
      },
      this.secret,
      { expiresIn: expiresInSeconds },
    );
  }

  verify(token: string): PatientSessionTokenPayload {
    const decoded = verify(token, this.secret) as JwtBody;
    if (
      decoded.typ !== PATIENT_SESSION_TOKEN_TYPE ||
      !decoded.registrationLinkId
    ) {
      throw new Error("Invalid patient session token");
    }
    return {
      registrationLinkId: decoded.registrationLinkId,
      typ: PATIENT_SESSION_TOKEN_TYPE,
    };
  }
}
