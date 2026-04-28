import { approveRegistration } from "./approve-registration";
import { RegistrationRequest } from "~/modules/registration/domain/entities/registration-request.entity";
import { RegistrationDocument } from "~/modules/registration/domain/entities/registration-document.entity";
import { PatientRecord } from "~/modules/registration/domain/entities/patient-record.entity";
import { Practice } from "~/modules/registration/domain/entities/practice.entity";
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
  return new RegistrationRequest(REQUEST_ID, PATIENT_ID, PRACTICE_ID, RegistrationStatus.awaitingReview());
}

function makeDocument(): RegistrationDocument {
  return RegistrationDocument.fromPersisted({
    id: "doc-1",
    registrationRequestId: REQUEST_ID,
    patientIdentityId: PATIENT_ID.toString(),
    submittedAt: new Date("2025-01-01"),
    ...NULL_PROFILE,
  });
}

function makePatient(): PatientRecord {
  return PatientRecord.fromPersisted({
    id: "patient-1",
    patientIdentityId: PATIENT_ID.toString(),
    updatedAt: new Date("2025-01-01"),
    ...NULL_PROFILE,
  });
}

function makePractice(): Practice {
  return new Practice(PRACTICE_ID, "Test Practice");
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("approveRegistration", () => {
  it("throws when request is null", () => {
    expect(() =>
      approveRegistration({ request: null, document: makeDocument(), patient: makePatient(), practice: makePractice() }),
    ).toThrow("Registration request required for approval");
  });

  it("throws when document is null", () => {
    expect(() =>
      approveRegistration({ request: makeRequest(), document: null, patient: makePatient(), practice: makePractice() }),
    ).toThrow("Registration document required for approval");
  });

  it("throws when patient is null", () => {
    expect(() =>
      approveRegistration({ request: makeRequest(), document: makeDocument(), patient: null, practice: makePractice() }),
    ).toThrow("Patient invalid");
  });

  it("throws when practice is null", () => {
    expect(() =>
      approveRegistration({ request: makeRequest(), document: makeDocument(), patient: makePatient(), practice: null }),
    ).toThrow("Practice invalid");
  });

  it("transitions the request to APPROVED status", () => {
    const request = makeRequest();
    approveRegistration({ request, document: makeDocument(), patient: makePatient(), practice: makePractice() });
    expect(request.getStatus().equals(RegistrationStatus.approved())).toBe(true);
  });

  it("returns updatedRequest carrying APPROVED status", () => {
    const effects = approveRegistration({
      request: makeRequest(), document: makeDocument(), patient: makePatient(), practice: makePractice(),
    });
    expect(effects.updatedRequest.status.equals(RegistrationStatus.approved())).toBe(true);
  });

  it("returns updatedPatient built from the document's profile VOs", () => {
    const document = makeDocument();
    const effects = approveRegistration({
      request: makeRequest(), document, patient: makePatient(), practice: makePractice(),
    });
    expect(effects.updatedPatient.contactDetails).toBe(document.contactDetails);
    expect(effects.updatedPatient.personalInformation).toBe(document.personalInformation);
    expect(effects.updatedPatient.medicalAidDetails).toBe(document.medicalAidDetails);
    expect(effects.updatedPatient.medicalHistory).toBe(document.medicalHistory);
  });

  it("returns patientPracticeLink with the correct patientIdentityId and practiceId", () => {
    const effects = approveRegistration({
      request: makeRequest(), document: makeDocument(), patient: makePatient(), practice: makePractice(),
    });
    expect(effects.patientPracticeLink.patientIdentityId).toBe(PATIENT_ID);
    expect(effects.patientPracticeLink.practiceId).toBe(PRACTICE_ID);
  });

  it("passes the practice through to effects unchanged", () => {
    const practice = makePractice();
    const effects = approveRegistration({
      request: makeRequest(), document: makeDocument(), patient: makePatient(), practice,
    });
    expect(effects.practice).toBe(practice);
  });
});
