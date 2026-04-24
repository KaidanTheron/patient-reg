export abstract class AuthLinkTokenSigner {
  abstract sign(linkUuid: string, expiresAt: Date): string;

  abstract verify(token: string): { linkUuid: string };
}
