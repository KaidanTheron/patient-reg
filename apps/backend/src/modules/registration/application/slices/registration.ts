import { Injectable } from "@nestjs/common";
import { Practice } from "../../domain/entities/practice.entity";
import { PatientIdentityRepository } from "../../domain/ports/patient-identity.repository";
import { PracticeRepository } from "../../domain/ports/practice.repository";
import { RegistrationRequestRepository } from "../../domain/ports/registration-request.repository";
import { Notifier } from "../../domain/ports/notifier";
import { RegistrationLinkTokenSigner } from "../../domain/ports/registration-link-token.signer";
import { RegistrationLinkFormatter } from "../../domain/ports/registration-link.formatter";
import {
  DraftRegistrationRequest,
  UpdateRegistrationRequest,
} from "../../domain/entities/registration-request.entity";
import {
  DraftRegistrationLink,
  UpdateRegistrationLink,
} from "../../domain/entities/registration-link.entity";
import { RegistrationLinkStatus } from "../../domain/value-objects/registration-link-status";
import { PatientSessionTokenSigner } from "../../domain/ports/patient-session-token.signer";
import {
  MAX_ATTEMPTS,
  PATIENT_SESSION_TTL_MS,
} from "../../domain/constants/registration-link.constants";
import { HashedRsaId } from "../../domain/value-objects/hashed-rsaid";
import { RsaIdNumber } from "../../domain/value-objects/rsaid";
import { Hasher } from "../../domain/ports/hasher";
import { RegistrationLinkRepository } from "../../domain/ports/registration-link.repository";
import { Encrypter } from "../../domain/ports/encrypter";
import { DraftPatientPractice } from "../../domain/entities/patient-practice.entity";
import { PatientPracticeRepository } from "../../domain/ports/patient-practice.repository";
import { RegistrationDocumentRepository } from "../../domain/ports/registration-document.repository";
import {
  DraftRegistrationDocument,
  UpdateRegistrationDocument,
} from "../../domain/entities/registration-document.entity";
import { ContactDetails } from "../../domain/value-objects/contact-details";
import {
  ProtectedPatientSession,
  type VerifiedPatientSession,
} from "../support/protected-patient-session";

export type CreatePracticeCommand = {
  name: string;
};

export type PracticeResult = {
  id: string;
  name: string;
};

export type ApproveRegistrationCommand = {
  registrationRequestId: string;
  approvedByStaffId: string;
};

export type ApproveRegistrationResult = {
  registrationRequestId: string;
  registrationRequestStatus: string;
};

export type InitiateRegistrationCommand = {
  patientIdentityId: string;
  practiceId: string;
  initiatedByStaffId: string;
};

export type InitiateRegistrationResult = {
  registrationRequestId: string;
  registrationRequestStatus: string;
};

export type DeriveDataCommand = {
  patientIdentityId: string;
};

/**
 * `patientSession` must be produced by {@link ProtectedPatientSession} (e.g. GraphQL
 * `PatientSessionGuard` + `@PatientSession()`), not a raw token string.
 */
export type SubmitRegistrationDocumentCommand = {
  patientSession: VerifiedPatientSession;
  registrationRequestId: string;
  email: string;
  phoneNumber: string;
  residentialAddress: string;
};

export type SubmitRegistrationDocumentResult = {
  registrationRequestId: string;
  registrationRequestStatus: string;
};

export type RegistrationRequestListItem = {
  registrationRequestId: string;
  registrationRequestStatus: string;
  rejectionReason?: string;
};

export type VerifyRegistrationCommand = {
  registrationLinkId: string;
  rsaId: string;
};

export type VerifyRegistrationErrorCode =
  | "REGISTRATION_LINK_NOT_FOUND"
  | "EXPIRED"
  | "LINK_REVOKED"
  | "IDENTITY_MISMATCH"
  | "ATTEMPTS_EXHAUSTED"
  | "INVALID_STATE"
  | "INVALID_LINK_TOKEN";

export type VerifyRegistrationResult =
  | {
      success: true;
      sessionToken: string;
      /** ISO-8601; aligns with the JWT `exp` claim. */
      expiresAt: string;
      /** The verified registration link id; same claim as in the session JWT. */
      registrationLinkId: string;
    }
  | {
      success: false;
      errorCode: VerifyRegistrationErrorCode;
      maxAttempts: number;
      attemptsAfterFailure?: number;
    };

@Injectable()
export class RegistrationService {
  constructor(
    private readonly registrationRequests: RegistrationRequestRepository,
    private readonly registrationLinks: RegistrationLinkRepository,
    private readonly patientIdentities: PatientIdentityRepository,
    private readonly practices: PracticeRepository,
    private readonly patientPractices: PatientPracticeRepository,
    private readonly registrationDocuments: RegistrationDocumentRepository,
    private readonly notifier: Notifier,
    private readonly hasher: Hasher,
    private readonly encrypter: Encrypter,
    private readonly registrationLinkTokenSigner: RegistrationLinkTokenSigner,
    private readonly patientSessionTokenSigner: PatientSessionTokenSigner,
    private readonly registrationLinkFormatter: RegistrationLinkFormatter,
    private readonly protectedPatientSession: ProtectedPatientSession,
  ) {}

  // updates registration request status, updates patient record and links patient and practice
  async approveRegistration(
    command: ApproveRegistrationCommand,
  ): Promise<ApproveRegistrationResult> {
    const request = await this.registrationRequests.findById(
      command.registrationRequestId,
    );

    if (!request) {
      throw new Error("Registration request not found");
    }

    request.approve();

    await this.registrationRequests.update(
      command.registrationRequestId,
      new UpdateRegistrationRequest(
        request.getStatus(),
        request.getRejectionReason() ?? null,
      ),
    );

    await this.patientPractices.ensureLinked(
      new DraftPatientPractice(request.patientIdentityId, request.practiceId),
    );

    return {
      registrationRequestId: request.id,
      registrationRequestStatus: request.getStatus().toString(),
    };
  }

  // rejects a registration submission
  async rejectRegistration() {}

  // creates registration request, auth link and notifies patient
  async initiateRegistration(
    command: InitiateRegistrationCommand,
  ): Promise<InitiateRegistrationResult> {
    const {
      patientIdentityId: rawIdentity,
      practiceId,
      initiatedByStaffId,
    } = command;
    const identity = RsaIdNumber.create(rawIdentity);
    const hashedIdentity = await HashedRsaId.create(identity, this.hasher);

    const [patient, practice] = await Promise.all([
      this.patientIdentities.findById(hashedIdentity),
      this.practices.findById(practiceId),
    ]);

    if (!patient) {
      throw new Error("Registrant not found.");
    }

    if (!patient.email && !patient.phone) {
      throw new Error(
        "Registrant contact details not found, unable to initiate registration privately.",
      );
    }

    if (!practice) {
      throw new Error("Practice not found.");
    }

    const alreadyExists =
      await this.registrationRequests.findByPatientAndPractice(
        hashedIdentity,
        practiceId,
      );
    if (alreadyExists) {
      throw new Error("A registration request for this patient already exists");
    }

    const newRequest = new DraftRegistrationRequest(hashedIdentity, practiceId);

    const created = await this.registrationRequests.create(newRequest);

    await this.registrationLinks.revokeActiveForPatient(hashedIdentity);

    const draftLink = DraftRegistrationLink.create(
      hashedIdentity,
      initiatedByStaffId,
    );
    const link = await this.registrationLinks.create(draftLink);

    const token = this.registrationLinkTokenSigner.sign({
      registrationLinkId: link.id,
      expiresAt: link.expiresAt,
    });
    const sendableUrl = this.registrationLinkFormatter.format(token);
    const rawEmail = await patient.email?.decrypt(this.encrypter);
    const rawPhone = await patient.phone?.decrypt(this.encrypter);
    await this.notifier.notify(
      rawEmail ?? rawPhone!, // one of the two will be defined because of check
      `Open ${sendableUrl} in your browser to continue registration (request ${created.id}).`,
    );

    return {
      registrationRequestId: created.id,
      registrationRequestStatus: created.getStatus().toString(),
    };
  }

  async createPractice(
    command: CreatePracticeCommand,
  ): Promise<PracticeResult> {
    if (!command.name.trim()) {
      throw new Error("Practice name is required");
    }

    const practice = await this.practices.create(command.name.trim());

    return this.toPracticeResult(practice);
  }

  async findPracticeById(id: Practice["id"]): Promise<PracticeResult | null> {
    const practice = await this.practices.findById(id);
    return practice ? this.toPracticeResult(practice) : null;
  }

  async findPractices(): Promise<PracticeResult[]> {
    const list = await this.practices.findAll();
    return list.map((p) => this.toPracticeResult(p));
  }

  // finds patient-practice links for a practice
  async findLinkedPatients(practiceId: Practice["id"]) {}

  // finds registration requests for a practice
  async findAllPracticeRegRequests(
    practiceId: Practice["id"],
  ): Promise<RegistrationRequestListItem[]> {
    const practice = await this.practices.findById(practiceId);
    if (!practice) {
      throw new Error("Practice not found.");
    }
    const requests =
      await this.registrationRequests.findAllByPracticeId(practiceId);
    return requests.map((request) => {
      const rejectionReason = request.getRejectionReason();
      return {
        registrationRequestId: request.id,
        registrationRequestStatus: request.getStatus().toString(),
        rejectionReason,
      };
    });
  }

  /**
   * Lists registration requests for the patient associated with a valid
   * patient session token. Resolves the patient via the link id embedded in
   * the session JWT and `RegistrationLinkRepository.findById`.
   */
  async findAllPatientRegRequests(
    session: string | VerifiedPatientSession,
  ): Promise<RegistrationRequestListItem[]> {
    const patientSession =
      typeof session === "string"
        ? await this.protectedPatientSession.verify(session)
        : session;
    const requests = await this.registrationRequests.findAllByPatientIdentity(
      patientSession.patientIdentityId,
    );
    return requests.map((request) => {
      const rejectionReason = request.getRejectionReason();
      return {
        registrationRequestId: request.id,
        registrationRequestStatus: request.getStatus().toString(),
        rejectionReason,
      };
    });
  }

  /**
   * Stores submitted contact details, upserts the registration document,
   * and moves the request to {@link RegistrationStatus.awaitingReview} when
   * the patient identity and workflow state are valid.
   *
   * Callers must pass a {@link VerifiedPatientSession} from
   * {@link ProtectedPatientSession} (e.g. patient session guard); this method
   * does not accept a raw session token.
   */
  async submitRegistrationDocument(
    command: SubmitRegistrationDocumentCommand,
  ): Promise<SubmitRegistrationDocumentResult> {
    const { patientIdentityId } = command.patientSession;
    const request = await this.registrationRequests.findById(
      command.registrationRequestId,
    );
    if (!request) {
      throw new Error("Registration request not found");
    }
    if (!patientIdentityId.equals(request.patientIdentityId)) {
      throw new Error("Session is not valid for this registration request");
    }

    const contact = ContactDetails.create({
      email: command.email,
      phoneNumber: command.phoneNumber,
      residentialAddress: command.residentialAddress,
    });

    request.submit(patientIdentityId);

    const existing =
      await this.registrationDocuments.findByRegistrationRequestId(request.id);
    if (existing) {
      const submittedAt = new Date();
      await this.registrationDocuments.update(
        existing.id,
        new UpdateRegistrationDocument(contact, submittedAt),
      );
    } else {
      await this.registrationDocuments.create(
        new DraftRegistrationDocument(
          request.id,
          request.patientIdentityId,
          contact,
        ),
      );
    }

    await this.registrationRequests.update(
      request.id,
      new UpdateRegistrationRequest(
        request.getStatus(),
        request.getRejectionReason() ?? null,
      ),
    );

    return {
      registrationRequestId: request.id,
      registrationRequestStatus: request.getStatus().toString(),
    };
  }

  // resends registration link for patient
  async resendRegistrationLink() {}

  /**
   * Verifies the patient against the registration link identified by the signed
   * token from the out-of-band URL (e.g. query param).
   */
  async verifyRegistrationByLinkToken(command: {
    token: string;
    rsaId: string;
  }): Promise<VerifyRegistrationResult> {
    let registrationLinkId: string;
    try {
      registrationLinkId = this.registrationLinkTokenSigner.verify(
        command.token,
      ).registrationLinkId;
    } catch {
      return {
        success: false,
        errorCode: "INVALID_LINK_TOKEN",
        maxAttempts: MAX_ATTEMPTS,
      };
    }
    return this.verifyRegistration({
      registrationLinkId,
      rsaId: command.rsaId,
    });
  }

  // verifies that user is patient corresponding to registration link
  async verifyRegistration(
    command: VerifyRegistrationCommand,
  ): Promise<VerifyRegistrationResult> {
    const link = await this.registrationLinks.findById(
      command.registrationLinkId,
    );
    if (!link) {
      return {
        success: false,
        errorCode: "REGISTRATION_LINK_NOT_FOUND",
        maxAttempts: MAX_ATTEMPTS,
      };
    }
    if (link.getStatus().equals(RegistrationLinkStatus.revoked())) {
      return {
        success: false,
        errorCode: "LINK_REVOKED",
        maxAttempts: link.maxAttempts,
      };
    }
    if (link.isExpired()) {
      return {
        success: false,
        errorCode: "EXPIRED",
        maxAttempts: link.maxAttempts,
      };
    }

    const identity = RsaIdNumber.create(command.rsaId);
    const hashed = await HashedRsaId.create(identity, this.hasher);

    if (!link.patient.equals(hashed)) {
      link.recordFailedIdentityVerification();
      await this.registrationLinks.update(
        link.id,
        new UpdateRegistrationLink(link.getStatus(), link.getAttempts()),
      );
      const justExhausted =
        link.getStatus().equals(RegistrationLinkStatus.revoked()) &&
        link.getAttempts() >= link.maxAttempts;
      return {
        success: false,
        errorCode: justExhausted ? "ATTEMPTS_EXHAUSTED" : "IDENTITY_MISMATCH",
        maxAttempts: link.maxAttempts,
        attemptsAfterFailure: link.getAttempts(),
      };
    }

    if (!link.canBeUsed(hashed)) {
      return {
        success: false,
        errorCode: "INVALID_STATE",
        maxAttempts: link.maxAttempts,
      };
    }

    try {
      link.consume(hashed);
    } catch {
      return {
        success: false,
        errorCode: "INVALID_STATE",
        maxAttempts: link.maxAttempts,
      };
    }

    await this.registrationLinks.update(
      link.id,
      new UpdateRegistrationLink(link.getStatus(), link.getAttempts()),
    );

    const sessionExpires = new Date(Date.now() + PATIENT_SESSION_TTL_MS);
    const sessionToken = this.patientSessionTokenSigner.sign({
      registrationLinkId: link.id,
      expiresAt: sessionExpires,
    });

    return {
      success: true,
      sessionToken,
      expiresAt: sessionExpires.toISOString(),
      registrationLinkId: link.id,
    };
  }

  // gets patient data for a verified patient session
//   async patient(): Patie

  private toPracticeResult(practice: Practice): PracticeResult {
    return {
      id: practice.id,
      name: practice.name,
    };
  }
}
