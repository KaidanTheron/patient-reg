import { RegistrationStatus } from "../value-objects/registration-status";
import { RegistrationStatePolicy } from "../policies/registration-state.policy";
import { HashedRsaId } from "../value-objects/hashed-rsaid";
import { Practice } from "./practice.entity";

export class NewRegistrationRequest {
  constructor(
    public readonly patientIdentityId: HashedRsaId,
    public readonly practiceId: Practice["id"],
  ) {}

  public static create(
    patientIdentityId: HashedRsaId,
    practiceId: Practice["id"],
  ) {
    return new NewRegistrationRequest(patientIdentityId, practiceId);
  }
}

export class RegistrationRequest {
  constructor(
    public readonly id: string,
    public readonly patientIdentityId: HashedRsaId,
    public readonly practiceId: Practice["id"],
    private status: RegistrationStatus,
    private rejectionReason?: string,
  ) {}

  static create(params: {
    id: string;
    patientIdentityId: HashedRsaId;
    practiceId: Practice["id"];
  }): RegistrationRequest {
    return new RegistrationRequest(
      params.id,
      params.patientIdentityId,
      params.practiceId,
      RegistrationStatus.awaitingCompletion(),
    );
  }

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
