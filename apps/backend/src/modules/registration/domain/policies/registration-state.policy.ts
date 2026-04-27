import { HashedRsaId } from "~/modules/registration/domain/value-objects/hashed-rsaid";
import { RegistrationStatus } from "~/modules/registration/domain/value-objects/registration-status";

export class RegistrationStatePolicy {
  // encode rule that registration can only be submitted if patient id matches and current state is elligible for submission
  static canSubmit(params: {
    status: RegistrationStatus;
    targetPatientId: HashedRsaId;
    currentPatientId: HashedRsaId;
  }): boolean {
    const { status, currentPatientId, targetPatientId } = params;

    return (
      currentPatientId.equals(targetPatientId) &&
      (status.equals(RegistrationStatus.awaitingCompletion()) ||
        status.equals(RegistrationStatus.rejected()))
    );
  }

  static canApprove(status: RegistrationStatus): boolean {
    return status.equals(RegistrationStatus.awaitingReview());
  }

  static canReject(status: RegistrationStatus): boolean {
    return status.equals(RegistrationStatus.awaitingReview());
  }
}
