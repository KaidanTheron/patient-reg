export type RegistrationLinkTokenPayload = {
  registrationLinkId: string;
};

export abstract class RegistrationLinkTokenSigner {
  abstract sign(params: {
    registrationLinkId: string;
    expiresAt: Date;
  }): string;

  abstract verify(token: string): RegistrationLinkTokenPayload;
}
