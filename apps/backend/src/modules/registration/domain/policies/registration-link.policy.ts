import { HashedRsaId } from "~/modules/registration/domain/value-objects/hashed-rsaid";
import { RegistrationLinkStatus } from "~/modules/registration/domain/value-objects/registration-link-status";

export class RegistrationLinkPolicy {
  static canUse(params: {
    status: RegistrationLinkStatus;
    expiresAt: Date;
    now?: Date;
    current: HashedRsaId;
    target: HashedRsaId;
    attempts: number;
    maxAttempts: number;
  }): boolean {
    const now = params.now ?? new Date();

    return (
      params.status.equals(RegistrationLinkStatus.active()) &&
      params.current.equals(params.target) &&
      params.attempts < params.maxAttempts &&
      params.expiresAt.getTime() > now.getTime()
    );
  }
}
