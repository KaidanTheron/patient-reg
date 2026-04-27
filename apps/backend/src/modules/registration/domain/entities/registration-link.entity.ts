import {
  HashedRsaId,
  RegistrationLinkStatus
} from "~/modules/registration/domain/value-objects";
import {
  MAX_ATTEMPTS,
  REGISTRATION_LINK_TTL_MS,
} from "~/modules/registration/domain/constants/registration-link.constants";

export type VerifyLinkOutcome =
  | { success: true }
  | {
      success: false;
      errorCode: "LINK_REVOKED" | "EXPIRED" | "IDENTITY_MISMATCH" | "ATTEMPTS_EXHAUSTED";
      attemptsAfterFailure?: number;
    };

export class DraftRegistrationLink {
  private status: RegistrationLinkStatus;
  public readonly expiresAt: Date;
  public readonly patient: HashedRsaId;
  public readonly createdByStaffId: string;
  private attempts: number;
  public readonly maxAttempts: number;

  private constructor(patient: HashedRsaId, createdByStaffId: string) {
    const trimmedId = createdByStaffId.trim();
    if (!trimmedId) {
      throw new Error("createdByStaffId is required");
    }

    this.status = RegistrationLinkStatus.active();
    this.attempts = 0;
    this.maxAttempts = MAX_ATTEMPTS;
    this.patient = patient;
    this.createdByStaffId = trimmedId;
    this.expiresAt = new Date(Date.now() + REGISTRATION_LINK_TTL_MS);
  }

  public static create(
    patient: HashedRsaId,
    createdByStaffId: string,
  ): DraftRegistrationLink {
    return new DraftRegistrationLink(patient, createdByStaffId);
  }
}

export class UpdateRegistrationLink {
  constructor(
    private status: RegistrationLinkStatus,
    private attempts: number,
  ) {}

  getStatus(): RegistrationLinkStatus {
    return this.status;
  }

  getAttempts(): number {
    return this.attempts;
  }
}

export class RegistrationLink {
  constructor(
    public readonly id: string,
    private status: RegistrationLinkStatus,
    public readonly expiresAt: Date,
    public readonly patient: HashedRsaId,
    public readonly createdByStaffId: string,
    private attempts: number,
    public readonly maxAttempts: number,
  ) {}

  public isExpired(now = new Date()): boolean {
    return this.expiresAt.getTime() <= now.getTime();
  }

  public getAttempts(): number {
    return this.attempts;
  }

  public getStatus(): RegistrationLinkStatus {
    return this.status;
  }

  public revoke(): void {
    this.status = RegistrationLinkStatus.revoked();
  }

  /**
   * Counts a failed identity check (e.g. wrong ID entered). If attempts reach
   * {@link maxAttempts}, the link is revoked. No-op if not active or already expired.
   */
  public recordFailedIdentityVerification(now = new Date()): void {
    if (!this.getStatus().equals(RegistrationLinkStatus.active())) {
      return;
    }
    if (this.isExpired(now)) {
      return;
    }
    this.attempts += 1;
    if (this.attempts >= this.maxAttempts) {
      this.revoke();
    }
  }

  /**
   * Verifies the claimed patient identity against this link.
   *
   * On a successful match, the link is intentionally NOT revoked — expiry
   * is the sole gate against re-use, allowing the same session URL to be
   * opened multiple times within the TTL.
   *
   * On an identity mismatch, the attempt counter is incremented. Once
   * {@link maxAttempts} is reached the link is revoked to prevent brute-force.
   */
  public verify(claimedPatient: HashedRsaId, now = new Date()): VerifyLinkOutcome {
    if (this.getStatus().equals(RegistrationLinkStatus.revoked())) {
      return { success: false, errorCode: "LINK_REVOKED" };
    }
    if (this.isExpired(now)) {
      return { success: false, errorCode: "EXPIRED" };
    }
    if (!this.patient.equals(claimedPatient)) {
      this.recordFailedIdentityVerification(now);
      const exhausted = this.getStatus().equals(RegistrationLinkStatus.revoked());
      return {
        success: false,
        errorCode: exhausted ? "ATTEMPTS_EXHAUSTED" : "IDENTITY_MISMATCH",
        attemptsAfterFailure: this.getAttempts(),
      };
    }
    return { success: true };
  }
}
