export const PATIENT_SESSION_TOKEN_TYPE = "patient_session" as const;

export type PatientSessionTokenPayload = {
  /** The registration link id; never includes the patient’s hashed ID. */
  registrationLinkId: string;
  typ: typeof PATIENT_SESSION_TOKEN_TYPE;
};

export abstract class PatientSessionTokenSigner {
  abstract sign(params: { registrationLinkId: string; expiresAt: Date }): string;

  abstract verify(token: string): PatientSessionTokenPayload;
}
