import { RegistrationRequest } from "./registration-request.entity";
import { HashedRsaId } from "~/modules/registration/domain/value-objects/hashed-rsaid";
import { RegistrationStatus } from "~/modules/registration/domain/value-objects/registration-status";

// ── Helpers ───────────────────────────────────────────────────────────────────

const PATIENT_ID = HashedRsaId.fromPersisted("hashed-patient-a");
const OTHER_PATIENT_ID = HashedRsaId.fromPersisted("hashed-patient-b");
const PRACTICE_ID = "practice-1";
const REQUEST_ID = "req-1";

function makeRequest(status: RegistrationStatus): RegistrationRequest {
  return new RegistrationRequest(REQUEST_ID, PATIENT_ID, PRACTICE_ID, status);
}

// ── RegistrationRequest.submit ────────────────────────────────────────────────

describe("RegistrationRequest.submit", () => {
  it("throws when the request is already AWAITING_REVIEW (duplicate submission)", () => {
    const request = makeRequest(RegistrationStatus.awaitingReview());
    expect(() => request.submit(PATIENT_ID)).toThrow(
      "Cannot submit registration in current state",
    );
  });

  it("throws when the request is already APPROVED (invalid state)", () => {
    const request = makeRequest(RegistrationStatus.approved());
    expect(() => request.submit(PATIENT_ID)).toThrow(
      "Cannot submit registration in current state",
    );
  });

  it("throws when the patient identity does not match the request (wrong patient)", () => {
    const request = makeRequest(RegistrationStatus.awaitingCompletion());
    expect(() => request.submit(OTHER_PATIENT_ID)).toThrow(
      "Cannot submit registration in current state",
    );
  });

  it("succeeds when status is AWAITING_COMPLETION and patient matches", () => {
    const request = makeRequest(RegistrationStatus.awaitingCompletion());
    expect(() => request.submit(PATIENT_ID)).not.toThrow();
    expect(request.getStatus().equals(RegistrationStatus.awaitingReview())).toBe(true);
  });

  it("succeeds when status is REJECTED and patient matches (resubmission)", () => {
    const request = makeRequest(RegistrationStatus.rejected());
    expect(() => request.submit(PATIENT_ID)).not.toThrow();
    expect(request.getStatus().equals(RegistrationStatus.awaitingReview())).toBe(true);
  });
});

// ── RegistrationRequest.approve ───────────────────────────────────────────────

describe("RegistrationRequest.approve", () => {
  it("throws when the request is AWAITING_COMPLETION (not yet submitted)", () => {
    const request = makeRequest(RegistrationStatus.awaitingCompletion());
    expect(() => request.approve()).toThrow(
      "Only submitted registrations can be approved",
    );
  });

  it("throws when the request is already APPROVED (invalid state)", () => {
    const request = makeRequest(RegistrationStatus.approved());
    expect(() => request.approve()).toThrow(
      "Only submitted registrations can be approved",
    );
  });

  it("throws when the request is REJECTED (invalid state)", () => {
    const request = makeRequest(RegistrationStatus.rejected());
    expect(() => request.approve()).toThrow(
      "Only submitted registrations can be approved",
    );
  });

  it("succeeds when the request is AWAITING_REVIEW", () => {
    const request = makeRequest(RegistrationStatus.awaitingReview());
    expect(() => request.approve()).not.toThrow();
    expect(request.getStatus().equals(RegistrationStatus.approved())).toBe(true);
  });
});

// ── RegistrationRequest.reject ────────────────────────────────────────────────

describe("RegistrationRequest.reject", () => {
  it("throws when the request is AWAITING_COMPLETION (not yet submitted)", () => {
    const request = makeRequest(RegistrationStatus.awaitingCompletion());
    expect(() => request.reject("incorrect details")).toThrow(
      "Only submitted registrations can be rejected",
    );
  });

  it("throws when the request is already APPROVED (invalid state)", () => {
    const request = makeRequest(RegistrationStatus.approved());
    expect(() => request.reject("incorrect details")).toThrow(
      "Only submitted registrations can be rejected",
    );
  });

  it("succeeds when the request is AWAITING_REVIEW", () => {
    const request = makeRequest(RegistrationStatus.awaitingReview());
    expect(() => request.reject("incorrect details")).not.toThrow();
    expect(request.getStatus().equals(RegistrationStatus.rejected())).toBe(true);
  });
});
