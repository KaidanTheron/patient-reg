import { PatientIdentity } from "~/modules/registration/domain/entities/patient-identity.entity";
import { DraftPatientRecord } from "~/modules/registration/domain/entities/patient-record.entity";
import { RegistrationLink, UpdateRegistrationLink, VerifyLinkOutcome } from "~/modules/registration/domain/entities/registration-link.entity";
import { ContactDetails, MedicalAidDetails, MedicalHistory, PersonalInformation } from "~/modules/registration/domain/value-objects";
import { HashedRsaId } from "~/modules/registration/domain/value-objects/hashed-rsaid";

export type VerifyRegistrationInput = {
  link: RegistrationLink;
  hashedIdentity: HashedRsaId;
  patientIdentity: PatientIdentity | null;
};

export type VerifyRegistrationEffects = {
  outcome: VerifyLinkOutcome;
  /** Present when the link state must be persisted after a failed identity check */
  updatedLink: UpdateRegistrationLink | null;
  /** Present on success when a patient record should be seeded from the identity */
  newPatient: DraftPatientRecord | null;
};

/**
 * Pure domain operation for verifying a registration link against a claimed
 * RSA identity.
 *
 * Delegates to {@link RegistrationLink.verify}, which mutates the link in
 * place on a failed identity check. Returns the full set of effects the
 * application layer must persist. No repositories are called here.
 */
export function verifyRegistration(
  input: VerifyRegistrationInput,
): VerifyRegistrationEffects {
  const { link, hashedIdentity, patientIdentity } = input;

  const outcome = link.verify(hashedIdentity);

  if (!outcome.success) {
    const requiresLinkUpdate =
      outcome.errorCode === "IDENTITY_MISMATCH" ||
      outcome.errorCode === "ATTEMPTS_EXHAUSTED";

    return {
      outcome,
      updatedLink: requiresLinkUpdate
        ? new UpdateRegistrationLink(link.getStatus(), link.getAttempts())
        : null,
      newPatient: null,
    };
  }

  const newPatient = patientIdentity
    ? new DraftPatientRecord(
        hashedIdentity,
        ContactDetails.create({ email: patientIdentity.email, phone: patientIdentity.phone }),
        PersonalInformation.create({ firstname: patientIdentity.firstname, lastname: patientIdentity.lastname }),
        MedicalAidDetails.create({}),
        MedicalHistory.create({}),
      )
    : null;

  return { outcome, updatedLink: null, newPatient };
}
