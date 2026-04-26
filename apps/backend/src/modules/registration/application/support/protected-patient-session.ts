import { Injectable } from "@nestjs/common";
import { RegistrationLink } from "../../domain/entities/registration-link.entity";
import { PatientSessionTokenSigner } from "../../domain/ports/patient-session-token.signer";
import { RegistrationLinkRepository } from "../../domain/ports/registration-link.repository";
import { HashedRsaId } from "../../domain/value-objects/hashed-rsaid";

export type VerifiedPatientSession = {
  registrationLinkId: RegistrationLink["id"];
  patientIdentityId: HashedRsaId;
  registrationLink: RegistrationLink;
};

@Injectable()
export class ProtectedPatientSession {
  constructor(
    private readonly patientSessionTokenSigner: PatientSessionTokenSigner,
    private readonly registrationLinks: RegistrationLinkRepository,
  ) {}

  async run<T>(
    sessionToken: string,
    handler: (session: VerifiedPatientSession) => Promise<T>,
  ): Promise<T> {
    const { registrationLinkId } =
      this.patientSessionTokenSigner.verify(sessionToken);
    const link = await this.registrationLinks.findById(registrationLinkId);

    if (!link) {
      throw new Error("Invalid or stale session");
    }

    return handler({
      registrationLinkId: link.id,
      patientIdentityId: link.patient,
      registrationLink: link,
    });
  }
}
