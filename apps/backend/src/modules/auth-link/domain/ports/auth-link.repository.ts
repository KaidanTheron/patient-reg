import type { AuthLinkState } from "../auth-link.types";

export abstract class AuthLinkRepository {
  abstract revokeAllActiveForPatient(patient: string): Promise<void>;

  abstract createNew(params: {
    patient: string;
    createdBy: string;
    expiresAt: Date;
  }): Promise<AuthLinkState>;

  abstract findByUuid(uuid: string): Promise<AuthLinkState | null>;

  abstract saveState(state: AuthLinkState): Promise<void>;
}
