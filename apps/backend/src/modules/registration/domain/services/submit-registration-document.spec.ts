import { submitRegistrationDocument } from "./submit-registration-document";
import { RegistrationRequest } from "~/modules/registration/domain/entities/registration-request.entity";
import { RegistrationDocument } from "~/modules/registration/domain/entities/registration-document.entity";
import { ConsentRecord } from "~/modules/registration/domain/entities/consent-record.entity";
import { HashedRsaId } from "~/modules/registration/domain/value-objects/hashed-rsaid";
import { RegistrationStatus } from "~/modules/registration/domain/value-objects/registration-status";

// ── Helpers ───────────────────────────────────────────────────────────────────

const PATIENT_ID = HashedRsaId.fromPersisted("hashed-patient-a");
const PRACTICE_ID = "practice-1";
const REQUEST_ID = "req-1";

const NULL_PROFILE = {
  email: "enc-email", phoneNumber: null, altphone: null, residentialAddress: null,
  firstname: null, lastname: null, dateOfBirth: null, gender: null,
  scheme: null, memberNumber: null, mainMember: null, mainMemberId: null,
  dependantCode: null, allergies: null, currentMedication: null,
  chronicConditions: null, previousSurgeries: null, familyHistory: null,
};

function makeRequest(): RegistrationRequest {
  return new RegistrationRequest(REQUEST_ID, PATIENT_ID, PRACTICE_ID, RegistrationStatus.awaitingCompletion());
}

function makeConsent(): ConsentRecord {
  return new ConsentRecord("consent-1", REQUEST_ID, PATIENT_ID, "template-1", new Date("2025-01-01"));
}

function makeDocument(id = "doc-1"): RegistrationDocument {
  return RegistrationDocument.fromPersisted({
    id,
    registrationRequestId: REQUEST_ID,
    patientIdentityId: PATIENT_ID.toString(),
    submittedAt: new Date("2025-01-01"),
    ...NULL_PROFILE,
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("submitRegistrationDocument", () => {
  it("throws when request is null", () => {
    expect(() =>
      submitRegistrationDocument({ request: null, consent: makeConsent(), existingDocument: null, patientIdentityId: PATIENT_ID }),
    ).toThrow("Registration request not found.");
  });

  it("throws when consent is null", () => {
    expect(() =>
      submitRegistrationDocument({ request: makeRequest(), consent: null, existingDocument: null, patientIdentityId: PATIENT_ID }),
    ).toThrow("Consent must be given before submitting registration");
  });

  it("transitions the request to AWAITING_REVIEW", () => {
    const request = makeRequest();
    submitRegistrationDocument({ request, consent: makeConsent(), existingDocument: null, patientIdentityId: PATIENT_ID });
    expect(request.getStatus().equals(RegistrationStatus.awaitingReview())).toBe(true);
  });

  it("returns updatedRequest carrying AWAITING_REVIEW status", () => {
    const effects = submitRegistrationDocument({
      request: makeRequest(), consent: makeConsent(), existingDocument: null, patientIdentityId: PATIENT_ID,
    });
    expect(effects.updatedRequest.status.equals(RegistrationStatus.awaitingReview())).toBe(true);
  });

  it("returns existingDocumentId as null when no existing document", () => {
    const effects = submitRegistrationDocument({
      request: makeRequest(), consent: makeConsent(), existingDocument: null, patientIdentityId: PATIENT_ID,
    });
    expect(effects.existingDocumentId).toBeNull();
  });

  it("returns existingDocumentId matching the existing document's id", () => {
    const effects = submitRegistrationDocument({
      request: makeRequest(), consent: makeConsent(), existingDocument: makeDocument("doc-42"), patientIdentityId: PATIENT_ID,
    });
    expect(effects.existingDocumentId).toBe("doc-42");
  });
});
