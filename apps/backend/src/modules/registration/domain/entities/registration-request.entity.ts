import { RegistrationStatus } from "~/modules/registration/domain/value-objects/registration-status";
import { RegistrationStatePolicy } from "~/modules/registration/domain/policies/registration-state.policy";
import { HashedRsaId } from "~/modules/registration/domain/value-objects/hashed-rsaid";
import { Practice } from "~/modules/registration/domain/entities/practice.entity";

export class DraftRegistrationRequest {
  public readonly patientIdentityId: HashedRsaId;
  public readonly practiceId: Practice["id"];
  public readonly status: RegistrationStatus;
  public readonly rejectionReason?: string;

  constructor(patientIdentityId: HashedRsaId, practiceId: Practice["id"]) {
    this.patientIdentityId = patientIdentityId;
    this.practiceId = practiceId;
    this.status = RegistrationStatus.awaitingCompletion();
    this.rejectionReason = undefined;
  }
}

export class UpdateRegistrationRequest {
  constructor(
    public readonly status: RegistrationStatus,
    public readonly rejectionReason: string | null = null,
  ) {}
}

export class RegistrationRequest {
  constructor(
    public readonly id: string,
    public readonly patientIdentityId: HashedRsaId,
    public readonly practiceId: Practice["id"],
    private status: RegistrationStatus,
    private rejectionReason?: string,
  ) {}

  getStatus(): RegistrationStatus {
    return this.status;
  }

  getRejectionReason(): string | undefined {
    return this.rejectionReason;
  }

  markAwaitingCompletion(): void {
    this.status = RegistrationStatus.awaitingCompletion();
  }

  submit(patientIdentityId: HashedRsaId): void {
    if (
      !RegistrationStatePolicy.canSubmit({
        status: this.status,
        currentPatientId: this.patientIdentityId,
        targetPatientId: patientIdentityId,
      })
    ) {
      throw new Error("Cannot submit registration in current state");
    }

    this.status = RegistrationStatus.awaitingReview();
    this.rejectionReason = undefined;
  }

  approve(): void {
    if (!RegistrationStatePolicy.canApprove(this.status)) {
      throw new Error("Only submitted registrations can be approved");
    }

    this.status = RegistrationStatus.approved();
  }

  reject(reason: string): void {
    if (!RegistrationStatePolicy.canReject(this.status)) {
      throw new Error("Only submitted registrations can be rejected");
    }

    if (!reason.trim()) {
      throw new Error("Rejection reason is required");
    }

    this.status = RegistrationStatus.rejected();
    this.rejectionReason = reason;
  }
}
