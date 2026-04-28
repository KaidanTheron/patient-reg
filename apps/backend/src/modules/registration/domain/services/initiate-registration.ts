import { PatientIdentity } from "~/modules/registration/domain/entities/patient-identity.entity";
import { Practice } from "~/modules/registration/domain/entities/practice.entity";
import { DraftRegistrationLink } from "~/modules/registration/domain/entities/registration-link.entity";
import { RegistrationRequest, DraftRegistrationRequest } from "~/modules/registration/domain/entities/registration-request.entity";
import { HashedRsaId } from "~/modules/registration/domain/value-objects/hashed-rsaid";

export type InitiateRegistrationInput = {
  patient: PatientIdentity | null;
  practice: Practice | null;
  existingRequest: RegistrationRequest | null;
  hashedIdentity: HashedRsaId;
  initiatedByStaffId: string;
};

export type InitiateRegistrationEffects = {
  /** The new registration request to persist */
  draftRequest: DraftRegistrationRequest;
  /** The new registration link to persist */
  draftLink: DraftRegistrationLink;
  /** The validated practice */
  practice: Practice;
  /** The validated patient identity */
  patient: PatientIdentity;
};

/**
 * Pure domain operation for initiating a registration request.
 *
 * Validates the preconditions, then returns the full set of effects that the
 * application layer must persist. No repositories are called here.
 *
 * @throws When the patient does not exist or has no contactable address.
 * @throws When the practice does not exist.
 * @throws When a registration request for this patient already exists.
 */
export function initiateRegistration(
  input: InitiateRegistrationInput,
): InitiateRegistrationEffects {
  const { patient, practice, existingRequest, hashedIdentity, initiatedByStaffId } = input;

  if (!patient) {
    throw new Error("Registrant not found.");
  }

  if (!patient.email && !patient.phone) {
    throw new Error(
      "Registrant contact details not found, unable to initiate registration privately.",
    );
  }

  if (!practice) {
    throw new Error("Practice not found.");
  }

  if (existingRequest) {
    throw new Error("A registration request for this patient already exists");
  }

  const draftRequest = new DraftRegistrationRequest(hashedIdentity, practice.id);
  const draftLink = DraftRegistrationLink.create(hashedIdentity, initiatedByStaffId);

  return { draftRequest, draftLink, practice, patient };
}
