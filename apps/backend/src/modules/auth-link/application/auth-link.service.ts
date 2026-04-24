import { Injectable, UnauthorizedException } from "@nestjs/common";
import { AUTH_LINK_TTL_MS } from "../domain/auth-link.constants";
import { AuthLinkStatus } from "../domain/auth-link-status";
import type { AuthLinkState } from "../domain/auth-link.types";
import { AuthLinkRepository } from "../domain/ports/auth-link.repository";
import { AuthLinkTokenSigner } from "../domain/ports/auth-link-token.signer";
import { AuthLinkNotifier } from "../domain/ports/auth-link.notifier";
import { AuthLinkFormatter } from "../domain/ports/auth-link.formatter";
import { IdentityHasher } from "../../identity/domain/ports/identity.hasher";

export type IssuedAuthLink = {
  uuid: string;
  expiresAt: Date;
};

export type ValidatedAuthLink = {
  uuid: string;
  patient: string;
};

@Injectable()
export class AuthLinkService {
  constructor(
    private readonly authLinks: AuthLinkRepository,
    private readonly tokens: AuthLinkTokenSigner,
    private readonly notifier: AuthLinkNotifier,
    private readonly formatter: AuthLinkFormatter,
    private readonly identityHasher: IdentityHasher,
  ) {}

  /**
   * Issues a new registration auth link JWT for the patient.
   */
  async issueRegistrationLink(params: {
    patient: string;
    createdBy: string;
  }): Promise<IssuedAuthLink> {
    const { createdBy, patient } = params;
    await this.authLinks.revokeAllActiveForPatient(patient);
    const expiresAt = new Date(Date.now() + AUTH_LINK_TTL_MS);
    const link = await this.authLinks.createNew({
      patient,
      createdBy,
      expiresAt,
    });
    const token = this.tokens.sign(link.uuid, link.expiresAt);
    const sendableLink = this.formatter.format(token);
    await this.notifier.notify(patient, `Open ${sendableLink} in your browser`);
    return { uuid: link.uuid, expiresAt: link.expiresAt }
  }

  /**
   * Validates a JWT and returns the persisted link context if it is still active and not past expiry.
   */
  async validateRegistrationLinkToken(
    token: string,
    id: string,
  ): Promise<ValidatedAuthLink> {
    let linkUuid: string;
    try {
      linkUuid = this.tokens.verify(token).linkUuid;
    } catch {
      throw new UnauthorizedException("Invalid or expired registration link");
    }

    const link = await this.authLinks.findByUuid(linkUuid);
    if (!link) {
      throw new UnauthorizedException("Registration link not found");
    }
    const hashedId = await this.identityHasher.hash(id);
    if (link.patient !== hashedId) {
      throw new UnauthorizedException(
        "Registration link does not match the provided identity",
      );
    }
    if (link.status !== AuthLinkStatus.ACTIVE) {
      throw new UnauthorizedException("Registration link is no longer valid");
    }
    if (link.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException("Registration link has expired");
    }
    return { uuid: link.uuid, patient: link.patient };
  }

  /**
   * Revokes the link after the patient has successfully verified identity (single-use access).
   */
  async revokeAfterSuccessfulVerification(linkUuid: string): Promise<void> {
    const link = await this.authLinks.findByUuid(linkUuid);
    if (!link || link.status !== AuthLinkStatus.ACTIVE) {
      return;
    }
    await this.authLinks.saveState({
      ...link,
      status: AuthLinkStatus.REVOKED,
    });
  }

  async revokeAllForPatient(patient: string): Promise<void> {
    this.authLinks.revokeAllActiveForPatient(patient);
  }

  /**
   * Records a failed ID verification attempt against the link (resend limits are out of scope).
   */
  async recordFailedVerificationAttempt(linkUuid: string): Promise<void> {
    const link = await this.authLinks.findByUuid(linkUuid);
    if (!link) {
      return;
    }
    await this.authLinks.saveState({
      ...link,
      attemptCount: link.attemptCount + 1,
    });
  }

  /** Loads the current persisted state for a link uuid, if any. */
  async findByUuid(uuid: string): Promise<AuthLinkState | null> {
    return this.authLinks.findByUuid(uuid);
  }
}
