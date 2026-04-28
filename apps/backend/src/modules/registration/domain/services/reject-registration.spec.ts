import { rejectRegistration } from "./reject-registration";
import { RegistrationRequest } from "~/modules/registration/domain/entities/registration-request.entity";
import { PatientIdentity } from "~/modules/registration/domain/entities/patient-identity.entity";
import { Practice } from "~/modules/registration/domain/entities/practice.entity";
import { HashedRsaId } from "~/modules/registration/domain/value-objects/hashed-rsaid";
import { RegistrationStatus } from "~/modules/registration/domain/value-objects/registration-status";
import { EncryptedValue } from "~/modules/registration/domain/value-objects/encrypted-value";

// ── Helpers ───────────────────────────────────────────────────────────────────

const PATIENT_ID = HashedRsaId.fromPersisted("hashed-patient-a");
const PRACTICE_ID = "practice-1";
const REQUEST_ID = "req-1";

function makeRequest(): RegistrationRequest {
  return new RegistrationRequest(REQUEST_ID, PATIENT_ID, PRACTICE_ID, RegistrationStatus.awaitingReview());
}

function makePatient(overrides?: { email?: EncryptedValue; phone?: EncryptedValue }): PatientIdentity {
  const email = overrides && "email" in overrides ? overrides.email : EncryptedValue.fromPersisted("enc-email");
  const phone = overrides && "phone" in overrides ? overrides.phone : undefined;
  return new PatientIdentity(PATIENT_ID, email, phone);
}

function makePractice(): Practice {
  return new Practice(PRACTICE_ID, "Test Practice");
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("rejectRegistration", () => {
  it("throws when request is null", () => {
    expect(() =>
      rejectRegistration({ request: null, patient: makePatient(), practice: makePractice(), reason: "reason" }),
    ).toThrow("Registration request required for rejection");
  });

  it("throws when practice is null", () => {
    expect(() =>
      rejectRegistration({ request: makeRequest(), patient: makePatient(), practice: null, reason: "reason" }),
    ).toThrow("Invalid practice");
  });

  it("throws when patient is null", () => {
    expect(() =>
      rejectRegistration({ request: makeRequest(), patient: null, practice: makePractice(), reason: "reason" }),
    ).toThrow("Invalid patient");
  });

  it("throws when patient has neither email nor phone", () => {
    const patient = makePatient({ email: undefined, phone: undefined });
    expect(() =>
      rejectRegistration({ request: makeRequest(), patient, practice: makePractice(), reason: "reason" }),
    ).toThrow("Patient cannot be notified of rejection.");
  });

  it("throws when reason is empty", () => {
    expect(() =>
      rejectRegistration({ request: makeRequest(), patient: makePatient(), practice: makePractice(), reason: "" }),
    ).toThrow("Rejection reason required");
  });

  it("throws when reason is whitespace only", () => {
    expect(() =>
      rejectRegistration({ request: makeRequest(), patient: makePatient(), practice: makePractice(), reason: "   " }),
    ).toThrow("Rejection reason required");
  });

  it("transitions the request to REJECTED status", () => {
    const request = makeRequest();
    rejectRegistration({ request, patient: makePatient(), practice: makePractice(), reason: "duplicate record" });
    expect(request.getStatus().equals(RegistrationStatus.rejected())).toBe(true);
  });

  it("returns updatedRequest carrying REJECTED status and the rejection reason", () => {
    const effects = rejectRegistration({
      request: makeRequest(), patient: makePatient(), practice: makePractice(), reason: "duplicate record",
    });
    expect(effects.updatedRequest.status.equals(RegistrationStatus.rejected())).toBe(true);
    expect(effects.updatedRequest.rejectionReason).toBe("duplicate record");
  });

  it("passes practice through to effects unchanged", () => {
    const practice = makePractice();
    const effects = rejectRegistration({
      request: makeRequest(), patient: makePatient(), practice, reason: "duplicate record",
    });
    expect(effects.practice).toBe(practice);
  });

  it("passes patient through to effects unchanged", () => {
    const patient = makePatient();
    const effects = rejectRegistration({
      request: makeRequest(), patient, practice: makePractice(), reason: "duplicate record",
    });
    expect(effects.patient).toBe(patient);
  });

  it("accepts a patient with only phone (no email)", () => {
    const patient = makePatient({ email: undefined, phone: EncryptedValue.fromPersisted("enc-phone") });
    expect(() =>
      rejectRegistration({ request: makeRequest(), patient, practice: makePractice(), reason: "reason" }),
    ).not.toThrow();
  });
});
