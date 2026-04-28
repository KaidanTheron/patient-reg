import { initiateRegistration } from "./initiate-registration";
import { RegistrationRequest } from "~/modules/registration/domain/entities/registration-request.entity";
import { PatientIdentity } from "~/modules/registration/domain/entities/patient-identity.entity";
import { Practice } from "~/modules/registration/domain/entities/practice.entity";
import { DraftRegistrationRequest } from "~/modules/registration/domain/entities/registration-request.entity";
import { DraftRegistrationLink } from "~/modules/registration/domain/entities/registration-link.entity";
import { HashedRsaId } from "~/modules/registration/domain/value-objects/hashed-rsaid";
import { RegistrationStatus } from "~/modules/registration/domain/value-objects/registration-status";
import { EncryptedValue } from "~/modules/registration/domain/value-objects/encrypted-value";

// ── Helpers ───────────────────────────────────────────────────────────────────

const PATIENT_ID = HashedRsaId.fromPersisted("hashed-patient-a");
const PRACTICE_ID = "practice-1";
const STAFF_ID = "staff-1";

function makePatient(overrides?: { email?: EncryptedValue; phone?: EncryptedValue }): PatientIdentity {
  const email = overrides && "email" in overrides ? overrides.email : EncryptedValue.fromPersisted("enc-email");
  const phone = overrides && "phone" in overrides ? overrides.phone : undefined;
  return new PatientIdentity(PATIENT_ID, email, phone);
}

function makePractice(): Practice {
  return new Practice(PRACTICE_ID, "Test Practice");
}

function makeRequest(): RegistrationRequest {
  return new RegistrationRequest("req-1", PATIENT_ID, PRACTICE_ID, RegistrationStatus.awaitingCompletion());
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("initiateRegistration", () => {
  it("throws when patient is null", () => {
    expect(() =>
      initiateRegistration({ patient: null, practice: makePractice(), existingRequest: null, hashedIdentity: PATIENT_ID, initiatedByStaffId: STAFF_ID }),
    ).toThrow("Registrant not found.");
  });

  it("throws when patient has neither email nor phone", () => {
    const patient = makePatient({ email: undefined, phone: undefined });
    expect(() =>
      initiateRegistration({ patient, practice: makePractice(), existingRequest: null, hashedIdentity: PATIENT_ID, initiatedByStaffId: STAFF_ID }),
    ).toThrow("Registrant contact details not found, unable to initiate registration privately.");
  });

  it("throws when practice is null", () => {
    expect(() =>
      initiateRegistration({ patient: makePatient(), practice: null, existingRequest: null, hashedIdentity: PATIENT_ID, initiatedByStaffId: STAFF_ID }),
    ).toThrow("Practice not found.");
  });

  it("throws when a registration request for this patient already exists", () => {
    expect(() =>
      initiateRegistration({ patient: makePatient(), practice: makePractice(), existingRequest: makeRequest(), hashedIdentity: PATIENT_ID, initiatedByStaffId: STAFF_ID }),
    ).toThrow("A registration request for this patient already exists");
  });

  it("returns a draftRequest with the correct patientIdentityId and practiceId", () => {
    const effects = initiateRegistration({
      patient: makePatient(), practice: makePractice(), existingRequest: null, hashedIdentity: PATIENT_ID, initiatedByStaffId: STAFF_ID,
    });
    expect(effects.draftRequest).toBeInstanceOf(DraftRegistrationRequest);
    expect(effects.draftRequest.patientIdentityId).toBe(PATIENT_ID);
    expect(effects.draftRequest.practiceId).toBe(PRACTICE_ID);
  });

  it("returns a draftLink with the correct patient and staff id", () => {
    const effects = initiateRegistration({
      patient: makePatient(), practice: makePractice(), existingRequest: null, hashedIdentity: PATIENT_ID, initiatedByStaffId: STAFF_ID,
    });
    expect(effects.draftLink).toBeInstanceOf(DraftRegistrationLink);
    expect(effects.draftLink.patient).toBe(PATIENT_ID);
    expect(effects.draftLink.createdByStaffId).toBe(STAFF_ID);
  });

  it("passes practice through to effects unchanged", () => {
    const practice = makePractice();
    const effects = initiateRegistration({
      patient: makePatient(), practice, existingRequest: null, hashedIdentity: PATIENT_ID, initiatedByStaffId: STAFF_ID,
    });
    expect(effects.practice).toBe(practice);
  });

  it("passes patient through to effects unchanged", () => {
    const patient = makePatient();
    const effects = initiateRegistration({
      patient, practice: makePractice(), existingRequest: null, hashedIdentity: PATIENT_ID, initiatedByStaffId: STAFF_ID,
    });
    expect(effects.patient).toBe(patient);
  });

  it("succeeds when patient has only email (no phone)", () => {
    const patient = makePatient({ email: EncryptedValue.fromPersisted("enc-email"), phone: undefined });
    expect(() =>
      initiateRegistration({ patient, practice: makePractice(), existingRequest: null, hashedIdentity: PATIENT_ID, initiatedByStaffId: STAFF_ID }),
    ).not.toThrow();
  });

  it("succeeds when patient has only phone (no email)", () => {
    const patient = makePatient({ email: undefined, phone: EncryptedValue.fromPersisted("enc-phone") });
    expect(() =>
      initiateRegistration({ patient, practice: makePractice(), existingRequest: null, hashedIdentity: PATIENT_ID, initiatedByStaffId: STAFF_ID }),
    ).not.toThrow();
  });
});
