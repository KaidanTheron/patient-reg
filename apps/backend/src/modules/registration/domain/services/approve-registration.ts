import { RegistrationRequest, UpdateRegistrationRequest } from "~/modules/registration/domain/entities/registration-request.entity";
import { RegistrationDocument } from "~/modules/registration/domain/entities/registration-document.entity";
import { PatientRecord, UpdatePatientRecord } from "~/modules/registration/domain/entities/patient-record.entity";
import { DraftPatientPractice } from "~/modules/registration/domain/entities/patient-practice.entity";
import { Practice } from "../entities/practice.entity";

export type ApproveRegistrationInput = {
  request: RegistrationRequest | null;
  document: RegistrationDocument | null;
  patient: PatientRecord | null;
  practice: Practice | null;
};

export type ApproveRegistrationEffects = {
  /** The updated registration request to persist */
  updatedRequest: UpdateRegistrationRequest;
  /** New updated patient to replace existing patient records */
  updatedPatient: UpdatePatientRecord;
  /** Establishes new link between patient and practice */
  patientPracticeLink: DraftPatientPractice;
  /** The validated practice */
  practice: Practice,
};

/**
 * Pure domain operation for approving a registration request.
 *
 * Mutates `input.request` in place (transitions to APPROVED), then returns
 * the full set of effects that the application layer must persist. No
 * repositories are called here.
 *
 * @throws When the request cannot be approved in its current state.
 * @throws When `existingPatientRecord` is null and `patientIdentity` is also null.
 */
export function approveRegistration(
  input: ApproveRegistrationInput,
): ApproveRegistrationEffects {
  const { request, document, patient, practice } = input;

  if (!request) {
    throw new Error("Registration request required for approval")
  }

  if (!document) {
    throw new Error("Registration document required for approval");
  }

  if (!patient) {
    throw new Error("Patient invalid")
  }

  if (!practice) {
    throw new Error("Practice invalid")
  }

  request.approve();

  const updatedRequest = new UpdateRegistrationRequest(
    request.getStatus(),
    request.getRejectionReason(),
  );

  const updatedPatient = new UpdatePatientRecord(
    document.contactDetails,
    document.personalInformation,
    document.medicalAidDetails,
    document.medicalHistory,
  );

  const patientPracticeLink = new DraftPatientPractice(
    request.patientIdentityId,
    request.practiceId,
  );

  return { updatedRequest, updatedPatient, patientPracticeLink, practice };
}
