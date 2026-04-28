import { ConsentRecord } from "~/modules/registration/domain/entities/consent-record.entity";
import { RegistrationDocument } from "~/modules/registration/domain/entities/registration-document.entity";
import { RegistrationRequest, UpdateRegistrationRequest } from "~/modules/registration/domain/entities/registration-request.entity";
import { HashedRsaId } from "~/modules/registration/domain/value-objects/hashed-rsaid";

export type SubmitRegistrationDocumentInput = {
  request: RegistrationRequest | null;
  consent: ConsentRecord | null;
  existingDocument: RegistrationDocument | null;
  patientIdentityId: HashedRsaId;
};

export type SubmitRegistrationDocumentEffects = {
  /** The updated registration request to persist */
  updatedRequest: UpdateRegistrationRequest;
  /** Set when the document already exists and should be updated rather than created */
  existingDocumentId: string | null;
};

/**
 * Pure domain operation for submitting a registration document.
 *
 * Validates that consent has been given, transitions the request to
 * AWAITING_REVIEW, and returns the set of effects the application layer must
 * persist. No repositories are called here.
 *
 * @throws When the request does not exist.
 * @throws When consent has not been recorded for this registration request.
 */
export function submitRegistrationDocument(
  input: SubmitRegistrationDocumentInput,
): SubmitRegistrationDocumentEffects {
  const { request, consent, existingDocument, patientIdentityId } = input;

  if (!request) {
    throw new Error("Registration request not found.");
  }

  if (!consent) {
    throw new Error("Consent must be given before submitting registration");
  }

  request.submit(patientIdentityId);

  const updatedRequest = new UpdateRegistrationRequest(
    request.getStatus(),
    request.getRejectionReason(),
  );

  return {
    updatedRequest,
    existingDocumentId: existingDocument?.id ?? null,
  };
}
