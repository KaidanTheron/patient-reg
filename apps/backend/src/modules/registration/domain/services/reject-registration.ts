import { RegistrationRequest, UpdateRegistrationRequest } from "~/modules/registration/domain/entities/registration-request.entity";
import { Practice } from "../entities/practice.entity";
import { PatientIdentity } from "../entities/patient-identity.entity";

export type RejectRegistrationInput = {
  request: RegistrationRequest | null;
  patient: PatientIdentity | null;
  reason?: string;
  practice: Practice | null;
};

export type RejectRegistrationEffects = {
  /** The updated registration request to persist */
  updatedRequest: UpdateRegistrationRequest;
  /** The validated practice associated with the rejection */
  practice: Practice,
  /** The validated patient to be notified of rejection */
  patient: PatientIdentity,
};

/**
 * Pure domain operation for rejecting a registration request.
 *
 * Mutates `input.request` in place (transitions to REJECTED), then returns
 * the full set of effects that the application layer must persist. No
 * repositories are called here.
 *
 * @throws When the request cannot be rejected in its current state.
 */
export function rejectRegistration(
  input: RejectRegistrationInput,
): RejectRegistrationEffects {
  const { request, reason, practice, patient } = input;

  if (!request) {
    throw new Error("Registration request required for rejection");
  }

  if (!practice) {
    throw new Error("Invalid practice");
  }

  if (!patient) {
    throw new Error("Invalid patient");
  }

  if (!patient.phone && !patient.email) {
    throw new Error("Patient cannot be notified of rejection.")
  }

  if (!reason?.trim()) {
    throw Error("Rejection reason required");
  }

  request.reject(reason);

  const updatedRequest = new UpdateRegistrationRequest(
    request.getStatus(),
    request.getRejectionReason(),
  );

  return { updatedRequest, practice, patient };
}
