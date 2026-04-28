import { verifyRegistration } from "./verify-registration";
import { RegistrationLink } from "~/modules/registration/domain/entities/registration-link.entity";
import { PatientIdentity } from "~/modules/registration/domain/entities/patient-identity.entity";
import { DraftPatientRecord } from "~/modules/registration/domain/entities/patient-record.entity";
import { HashedRsaId, RegistrationLinkStatus } from "~/modules/registration/domain/value-objects";
import { EncryptedValue } from "~/modules/registration/domain/value-objects/encrypted-value";
import { MAX_ATTEMPTS } from "~/modules/registration/domain/constants/registration-link.constants";

// ── Helpers ───────────────────────────────────────────────────────────────────

const PATIENT_A = HashedRsaId.fromPersisted("hashed-patient-a");
const PATIENT_B = HashedRsaId.fromPersisted("hashed-patient-b");
const STAFF_ID = "staff-1";

const FUTURE = new Date(Date.now() + 60_000);
const PAST = new Date(Date.now() - 60_000);

function makeLink(overrides: {
  status?: RegistrationLinkStatus;
  expiresAt?: Date;
  patient?: HashedRsaId;
  attempts?: number;
  maxAttempts?: number;
} = {}): RegistrationLink {
  return new RegistrationLink(
    "link-1",
    overrides.status ?? RegistrationLinkStatus.active(),
    overrides.expiresAt ?? FUTURE,
    overrides.patient ?? PATIENT_A,
    STAFF_ID,
    overrides.attempts ?? 0,
    overrides.maxAttempts ?? MAX_ATTEMPTS,
  );
}

function makePatientIdentity(): PatientIdentity {
  return new PatientIdentity(
    PATIENT_A,
    EncryptedValue.fromPersisted("enc-email"),
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("verifyRegistration — success", () => {
  it("returns { success: true } outcome when identity matches", () => {
    const effects = verifyRegistration({ link: makeLink(), hashedIdentity: PATIENT_A, patientIdentity: null });
    expect(effects.outcome).toEqual({ success: true });
  });

  it("returns updatedLink as null on success", () => {
    const effects = verifyRegistration({ link: makeLink(), hashedIdentity: PATIENT_A, patientIdentity: null });
    expect(effects.updatedLink).toBeNull();
  });

  it("returns a DraftPatientRecord when patientIdentity is provided", () => {
    const effects = verifyRegistration({
      link: makeLink(), hashedIdentity: PATIENT_A, patientIdentity: makePatientIdentity(),
    });
    expect(effects.newPatient).toBeInstanceOf(DraftPatientRecord);
    expect(effects.newPatient!.patientIdentityId).toBe(PATIENT_A);
  });

  it("returns newPatient as null when patientIdentity is null", () => {
    const effects = verifyRegistration({ link: makeLink(), hashedIdentity: PATIENT_A, patientIdentity: null });
    expect(effects.newPatient).toBeNull();
  });
});

describe("verifyRegistration — IDENTITY_MISMATCH", () => {
  it("returns IDENTITY_MISMATCH outcome", () => {
    const effects = verifyRegistration({ link: makeLink(), hashedIdentity: PATIENT_B, patientIdentity: null });
    expect(effects.outcome).toMatchObject({ success: false, errorCode: "IDENTITY_MISMATCH" });
  });

  it("returns updatedLink capturing the incremented attempt count", () => {
    const link = makeLink({ attempts: 0 });
    const effects = verifyRegistration({ link, hashedIdentity: PATIENT_B, patientIdentity: null });
    expect(effects.updatedLink).not.toBeNull();
    expect(effects.updatedLink!.getAttempts()).toBe(1);
  });

  it("returns newPatient as null", () => {
    const effects = verifyRegistration({ link: makeLink(), hashedIdentity: PATIENT_B, patientIdentity: null });
    expect(effects.newPatient).toBeNull();
  });
});

describe("verifyRegistration — ATTEMPTS_EXHAUSTED", () => {
  it("returns ATTEMPTS_EXHAUSTED outcome on the final failed attempt", () => {
    const link = makeLink({ attempts: MAX_ATTEMPTS - 1 });
    const effects = verifyRegistration({ link, hashedIdentity: PATIENT_B, patientIdentity: null });
    expect(effects.outcome).toMatchObject({ success: false, errorCode: "ATTEMPTS_EXHAUSTED" });
  });

  it("returns updatedLink with the revoked status", () => {
    const link = makeLink({ attempts: MAX_ATTEMPTS - 1 });
    const effects = verifyRegistration({ link, hashedIdentity: PATIENT_B, patientIdentity: null });
    expect(effects.updatedLink).not.toBeNull();
    expect(effects.updatedLink!.getStatus().equals(RegistrationLinkStatus.revoked())).toBe(true);
  });
});

describe("verifyRegistration — LINK_REVOKED", () => {
  it("returns LINK_REVOKED outcome", () => {
    const link = makeLink({ status: RegistrationLinkStatus.revoked() });
    const effects = verifyRegistration({ link, hashedIdentity: PATIENT_A, patientIdentity: null });
    expect(effects.outcome).toEqual({ success: false, errorCode: "LINK_REVOKED" });
  });

  it("returns updatedLink as null (no state change needed)", () => {
    const link = makeLink({ status: RegistrationLinkStatus.revoked() });
    const effects = verifyRegistration({ link, hashedIdentity: PATIENT_A, patientIdentity: null });
    expect(effects.updatedLink).toBeNull();
  });
});

describe("verifyRegistration — EXPIRED", () => {
  it("returns EXPIRED outcome", () => {
    const link = makeLink({ expiresAt: PAST });
    const effects = verifyRegistration({ link, hashedIdentity: PATIENT_A, patientIdentity: null });
    expect(effects.outcome).toEqual({ success: false, errorCode: "EXPIRED" });
  });

  it("returns updatedLink as null (no state change needed)", () => {
    const link = makeLink({ expiresAt: PAST });
    const effects = verifyRegistration({ link, hashedIdentity: PATIENT_A, patientIdentity: null });
    expect(effects.updatedLink).toBeNull();
  });
});
