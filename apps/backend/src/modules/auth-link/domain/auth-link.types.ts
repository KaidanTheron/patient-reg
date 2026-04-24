import type { AuthLinkStatus } from "./auth-link-status";

export type AuthLinkState = {
  id: number;
  uuid: string;
  patient: string;
  status: AuthLinkStatus;
  createdBy: string;
  expiresAt: Date;
  attemptCount: number;
};
