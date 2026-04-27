import {
  DraftRegistrationLink,
  RegistrationLink,
} from "./registration-link.entity";
import {
  HashedRsaId,
  RegistrationLinkStatus,
} from "~/modules/registration/domain/value-objects";
import {
  MAX_ATTEMPTS,
  REGISTRATION_LINK_TTL_MS,
} from "~/modules/registration/domain/constants/registration-link.constants";

// Helpers

const PATIENT_A = HashedRsaId.fromPersisted("hashed-id-patient-a");
const PATIENT_B = HashedRsaId.fromPersisted("hashed-id-patient-b");
const STAFF_ID = "staff-1";

const FUTURE = new Date(Date.now() + 60_000);
const PAST = new Date(Date.now() - 60_000);

// default registration link builder
function makeLink(overrides: {
  id?: string;
  status?: RegistrationLinkStatus;
  expiresAt?: Date;
  patient?: HashedRsaId;
  createdByStaffId?: string;
  attempts?: number;
  maxAttempts?: number;
}): RegistrationLink {
  return new RegistrationLink(
    overrides.id ?? "link-id-1",
    overrides.status ?? RegistrationLinkStatus.active(),
    overrides.expiresAt ?? FUTURE,
    overrides.patient ?? PATIENT_A,
    overrides.createdByStaffId ?? STAFF_ID,
    overrides.attempts ?? 0,
    overrides.maxAttempts ?? MAX_ATTEMPTS,
  );
}

describe("DraftRegistrationLink", () => {
  describe("create", () => {
    it("creates a link with maxAttempts set, the correct patient, and staff id", () => {
      const link = DraftRegistrationLink.create(PATIENT_A, STAFF_ID);
      expect(link.patient).toBe(PATIENT_A);
      expect(link.createdByStaffId).toBe(STAFF_ID);
      expect(link.maxAttempts).toBe(MAX_ATTEMPTS);
    });

    it("sets expiresAt to approximately now + TTL", () => {
      const before = Date.now();
      const link = DraftRegistrationLink.create(PATIENT_A, STAFF_ID);
      const after = Date.now();
      const expiresMs = link.expiresAt.getTime();
      expect(expiresMs).toBeGreaterThanOrEqual(before + REGISTRATION_LINK_TTL_MS);
      expect(expiresMs).toBeLessThanOrEqual(after + REGISTRATION_LINK_TTL_MS);
    });

    it("trims whitespace from createdByStaffId", () => {
      const link = DraftRegistrationLink.create(PATIENT_A, STAFF_ID.padEnd(STAFF_ID.length + 2, " "));
      expect(link.createdByStaffId).toBe(STAFF_ID);
    });

    it("throws when createdByStaffId is an empty string", () => {
      expect(() => DraftRegistrationLink.create(PATIENT_A, "")).toThrow(
        "createdByStaffId is required",
      );
    });

    it("throws when createdByStaffId is whitespace only", () => {
      expect(() => DraftRegistrationLink.create(PATIENT_A, "   ")).toThrow(
        "createdByStaffId is required",
      );
    });
  });
});

describe("RegistrationLink.isExpired", () => {
  it("returns false when expiresAt is in the future", () => {
    const link = makeLink({ expiresAt: FUTURE });
    expect(link.isExpired()).toBe(false);
  });

  it("returns true when expiresAt is in the past", () => {
    const link = makeLink({ expiresAt: PAST });
    expect(link.isExpired()).toBe(true);
  });

  it("returns true when the supplied 'now' equals expiresAt exactly", () => {
    const expiresAt = new Date(2030, 0, 1, 12, 0, 0);
    const link = makeLink({ expiresAt });
    expect(link.isExpired(expiresAt)).toBe(true);
  });

  it("accepts an injected 'now' so tests remain deterministic", () => {
    const expiresAt = new Date(2030, 0, 1, 12, 0, 0);
    const beforeExpiry = new Date(expiresAt.getTime() - 1);
    const link = makeLink({ expiresAt });
    expect(link.isExpired(beforeExpiry)).toBe(false);
  });
});

describe("RegistrationLink.revoke", () => {
  it("transitions an active link to REVOKED status", () => {
    const link = makeLink({});
    expect(link.getStatus().equals(RegistrationLinkStatus.active())).toBe(true);
    link.revoke();
    expect(link.getStatus().equals(RegistrationLinkStatus.revoked())).toBe(true);
  });
});

describe("RegistrationLink.recordFailedIdentityVerification", () => {
  it("increments the attempt counter on an active, non-expired link", () => {
    const link = makeLink({ attempts: 0 });
    link.recordFailedIdentityVerification(new Date());
    expect(link.getAttempts()).toBe(1);
  });

  it("revokes the link once attempts reach maxAttempts", () => {
    const link = makeLink({ attempts: MAX_ATTEMPTS - 1 });
    link.recordFailedIdentityVerification(new Date());
    expect(link.getAttempts()).toBe(MAX_ATTEMPTS);
    expect(link.getStatus().equals(RegistrationLinkStatus.revoked())).toBe(true);
  });

  it("is a no-op when the link is already revoked", () => {
    const link = makeLink({
      status: RegistrationLinkStatus.revoked(),
      attempts: 0,
    });
    link.recordFailedIdentityVerification(FUTURE);
    expect(link.getAttempts()).toBe(0);
  });

  it("is a no-op when the link is expired", () => {
    const link = makeLink({ expiresAt: PAST, attempts: 0 });
    link.recordFailedIdentityVerification(new Date());
    expect(link.getAttempts()).toBe(0);
  });
});

describe("RegistrationLink.verify", () => {
  it("returns { success: true } when the identity matches and the link is active", () => {
    const link = makeLink({ patient: PATIENT_A });
    const outcome = link.verify(PATIENT_A);
    expect(outcome).toEqual({ success: true });
  });

  it("does not revoke the link after a successful verification (re-use within TTL)", () => {
    const link = makeLink({ patient: PATIENT_A });
    link.verify(PATIENT_A);
    expect(link.getStatus().equals(RegistrationLinkStatus.active())).toBe(true);
  });

  it("returns LINK_REVOKED when the link has been revoked", () => {
    const link = makeLink({ status: RegistrationLinkStatus.revoked() });
    const outcome = link.verify(PATIENT_A);
    expect(outcome).toEqual({ success: false, errorCode: "LINK_REVOKED" });
  });

  it("returns EXPIRED when the link has expired", () => {
    const link = makeLink({ expiresAt: PAST });
    const outcome = link.verify(PATIENT_A, new Date());
    expect(outcome).toEqual({ success: false, errorCode: "EXPIRED" });
  });

  it("returns IDENTITY_MISMATCH when the claimed identity does not match", () => {
    const link = makeLink({ patient: PATIENT_A, attempts: 0, maxAttempts: MAX_ATTEMPTS });
    const outcome = link.verify(PATIENT_B);
    expect(outcome).toMatchObject({
      success: false,
      errorCode: "IDENTITY_MISMATCH",
    });
  });

  it("increments the attempt counter on each identity mismatch", () => {
    const link = makeLink({ patient: PATIENT_A, attempts: 0 });
    link.verify(PATIENT_B);
    expect(link.getAttempts()).toBe(1);
    link.verify(PATIENT_B);
    expect(link.getAttempts()).toBe(2);
  });

  it("includes attemptsAfterFailure in the IDENTITY_MISMATCH outcome", () => {
    const link = makeLink({ patient: PATIENT_A, attempts: 1, maxAttempts: MAX_ATTEMPTS });
    const outcome = link.verify(PATIENT_B);
    expect(outcome).toMatchObject({
      success: false,
      errorCode: "IDENTITY_MISMATCH",
      attemptsAfterFailure: 2,
    });
  });

  it("returns ATTEMPTS_EXHAUSTED when the final allowed attempt is a mismatch", () => {
    const link = makeLink({
      patient: PATIENT_A,
      attempts: MAX_ATTEMPTS - 1,
      maxAttempts: MAX_ATTEMPTS,
    });
    const outcome = link.verify(PATIENT_B);
    expect(outcome).toMatchObject({
      success: false,
      errorCode: "ATTEMPTS_EXHAUSTED",
      attemptsAfterFailure: MAX_ATTEMPTS,
    });
  });

  it("revokes the link when attempts are exhausted", () => {
    const link = makeLink({
      patient: PATIENT_A,
      attempts: MAX_ATTEMPTS - 1,
      maxAttempts: MAX_ATTEMPTS,
    });
    link.verify(PATIENT_B);
    expect(link.getStatus().equals(RegistrationLinkStatus.revoked())).toBe(true);
  });

  it("returns LINK_REVOKED (not IDENTITY_MISMATCH) for subsequent calls after exhaustion", () => {
    const link = makeLink({
      patient: PATIENT_A,
      attempts: MAX_ATTEMPTS - 1,
      maxAttempts: MAX_ATTEMPTS,
    });
    link.verify(PATIENT_B); // exhausts
    const second = link.verify(PATIENT_B);
    expect(second).toEqual({ success: false, errorCode: "LINK_REVOKED" });
  });

  it("EXPIRED is checked before IDENTITY_MISMATCH — expired links short-circuit immediately", () => {
    const link = makeLink({ expiresAt: PAST, patient: PATIENT_A, attempts: 0 });
    const outcome = link.verify(PATIENT_B, new Date());
    expect(outcome).toEqual({ success: false, errorCode: "EXPIRED" });
    // Expired check short-circuits — no attempt should be recorded.
    expect(link.getAttempts()).toBe(0);
  });

  it("LINK_REVOKED is checked before EXPIRED — revoked status takes priority", () => {
    const link = makeLink({
      status: RegistrationLinkStatus.revoked(),
      expiresAt: PAST,
    });
    const outcome = link.verify(PATIENT_A, new Date());
    expect(outcome).toEqual({ success: false, errorCode: "LINK_REVOKED" });
  });
});
