import { ForbiddenException, Injectable } from "@nestjs/common";
import { Practice } from "~/modules/registration/domain/entities/practice.entity";
import { PatientIdentityRepository } from "~/modules/registration/domain/ports/patient-identity.repository";
import { PatientRecordRepository } from "~/modules/registration/domain/ports/patient-record.repository";
import { PracticeRepository } from "~/modules/registration/domain/ports/practice.repository";
import { RegistrationRequestRepository } from "~/modules/registration/domain/ports/registration-request.repository";
import { Notifier } from "~/modules/registration/domain/ports/notifier";
import { RegistrationLinkTokenSigner } from "~/modules/registration/domain/ports/registration-link-token.signer";
import { RegistrationLinkFormatter } from "~/modules/registration/domain/ports/registration-link.formatter";
import {
  DraftRegistrationRequest,
  RegistrationRequest,
  UpdateRegistrationRequest,
} from "~/modules/registration/domain/entities/registration-request.entity";
import {
  DraftRegistrationLink,
  UpdateRegistrationLink,
} from "~/modules/registration/domain/entities/registration-link.entity";
import { RegistrationLinkStatus } from "~/modules/registration/domain/value-objects/registration-link-status";
import { PatientSessionTokenSigner } from "~/modules/registration/domain/ports/patient-session-token.signer";
import {
  MAX_ATTEMPTS,
  PATIENT_SESSION_TTL_MS,
} from "~/modules/registration/domain/constants/registration-link.constants";
import { HashedRsaId } from "~/modules/registration/domain/value-objects/hashed-rsaid";
import { RsaIdNumber } from "~/modules/registration/domain/value-objects/rsaid";
import { Hasher } from "~/modules/registration/domain/ports/hasher";
import { RegistrationLinkRepository } from "~/modules/registration/domain/ports/registration-link.repository";
import { Encrypter } from "~/modules/registration/domain/ports/encrypter";
import { DraftPatientPractice } from "~/modules/registration/domain/entities/patient-practice.entity";
import { PatientPracticeRepository } from "~/modules/registration/domain/ports/patient-practice.repository";
import { RegistrationDocumentRepository } from "~/modules/registration/domain/ports/registration-document.repository";
import { EncryptedValue } from "~/modules/registration/domain/value-objects/encrypted-value";
import {
  DraftRegistrationDocument,
  UpdateRegistrationDocument,
} from "~/modules/registration/domain/entities/registration-document.entity";
import {
  DraftPatientRecord,
  UpdatePatientRecord,
} from "~/modules/registration/domain/entities/patient-record.entity";
import { type VerifiedPatientSession } from "~/modules/registration/application/support/protected-patient-session";
import { type VerifiedPracticeSession } from "~/modules/registration/application/support/verified-practice-session";

export type CreatePracticeCommand = {
  name: string;
};

export type PracticeResult = {
  id: string;
  name: string;
};

export type ApproveRegistrationCommand = {
  /** Set from GraphQL `PracticeSessionGuard` / `@PracticeSession()`. */
  practiceSession: VerifiedPracticeSession;
  registrationRequestId: string;
  approvedByStaffId: string;
};

export type ApproveRegistrationResult = {
  registrationRequestId: string;
  registrationRequestStatus: string;
  practiceName: string;
};

export type InitiateRegistrationCommand = {
  patientIdentityId: string;
  initiatedByStaffId: string;
  /** Resolves the practice; resolver must align with `InitiateRegistrationInput.practiceId`. */
  practiceSession: VerifiedPracticeSession;
};

export type InitiateRegistrationResult = {
  registrationRequestId: string;
  registrationRequestStatus: string;
  practiceName: string;
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
  fullName: string;
  email: string;
  phoneNumber: string;
  residentialAddress: string;
};

export type SubmitRegistrationDocumentResult = {
  registrationRequestId: string;
  registrationRequestStatus: string;
  practiceName: string;
};

export type RegistrationRequestListItem = {
  registrationRequestId: string;
  registrationRequestStatus: string;
  rejectionReason?: string;
  practiceName: string;
  /** Decrypted from patient identity; absent before first document submit. */
  patientName?: string | null;
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

/** Decrypted profile fields for the session’s patient; sourced from the canonical patient record. */
export type PatientSessionDetails = {
  email?: string;
  phone?: string;
  residentialAddress?: string;
};

@Injectable()
export class RegistrationService {
  constructor(
    private readonly registrationRequests: RegistrationRequestRepository,
    private readonly registrationLinks: RegistrationLinkRepository,
    private readonly patientIdentities: PatientIdentityRepository,
    private readonly patientRecords: PatientRecordRepository,
    private readonly practices: PracticeRepository,
    private readonly patientPractices: PatientPracticeRepository,
    private readonly registrationDocuments: RegistrationDocumentRepository,
    private readonly notifier: Notifier,
    private readonly hasher: Hasher,
    private readonly encrypter: Encrypter,
    private readonly registrationLinkTokenSigner: RegistrationLinkTokenSigner,
    private readonly patientSessionTokenSigner: PatientSessionTokenSigner,
    private readonly registrationLinkFormatter: RegistrationLinkFormatter,
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

    if (request.practiceId !== command.practiceSession.practiceId) {
      throw new ForbiddenException(
        "Registration request does not belong to this practice",
      );
    }

    request.approve();

    await this.registrationRequests.update(
      command.registrationRequestId,
      new UpdateRegistrationRequest(
        request.getStatus(),
        request.getRejectionReason() ?? null,
      ),
    );

    const document =
      await this.registrationDocuments.findByRegistrationRequestId(request.id);
    if (!document) {
      throw new Error("Registration has no submitted document to approve");
    }

    const existingRecord = await this.patientRecords.findByPatientIdentity(
      request.patientIdentityId,
    );
    if (!existingRecord) {
      const identity = await this.patientIdentities.findById(
        request.patientIdentityId,
      );
      if (!identity) {
        throw new Error("Patient identity not found for this registration");
      }

      const { email, phone, fullName: idFullName } = identity;

      await this.patientRecords.ensureFromIdentity(
        new DraftPatientRecord(
          request.patientIdentityId,
          email,
          phone,
          idFullName,
        ),
      );
    }

    await this.patientRecords.update(
      request.patientIdentityId,
      new UpdatePatientRecord(
        document.email,
        document.phoneNumber,
        document.residentialAddress,
        document.fullName,
      ),
    );

    await this.patientPractices.ensureLinked(
      new DraftPatientPractice(request.patientIdentityId, request.practiceId),
    );

    const practiceName = await this.resolvePracticeName(request.practiceId);

    return {
      registrationRequestId: request.id,
      registrationRequestStatus: request.getStatus().toString(),
      practiceName,
    };
  }

  // rejects a registration submission
  async rejectRegistration() {}

  // creates registration request, auth link and notifies patient
  async initiateRegistration(
    command: InitiateRegistrationCommand,
  ): Promise<InitiateRegistrationResult> {
    const { patientIdentityId: rawIdentity, initiatedByStaffId } = command;
    const practiceId = command.practiceSession.practiceId;
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
      practiceName: practice.name,
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
  async findLinkedPatients(_practiceId: Practice["id"]) {}

  /**
   * Staff-only. Callers must pass a {@link VerifiedPracticeSession} from
   * {@link PracticeSessionGuard} (e.g. practice bearer token = practice id).
   */
  async findAllPracticeRegRequests(
    practiceSession: VerifiedPracticeSession,
  ): Promise<RegistrationRequestListItem[]> {
    const { practiceId } = practiceSession;
    const practice = await this.practices.findById(practiceId);
    if (!practice) {
      throw new Error("Practice not found.");
    }
    const requests =
      await this.registrationRequests.findAllByPracticeId(practiceId);
    return Promise.all(
      requests.map((request) =>
        this.toRegistrationRequestListItemWithIdentity(request, practice.name),
      ),
    );
  }

  /**
   * Lists registration requests for the verified patient session.
   *
   * Callers must pass a {@link VerifiedPatientSession} from
   * {@link ProtectedPatientSession} (e.g. patient session guard); this method
   * does not accept a raw session token.
   */
  async findAllPatientRegRequests(
    patientSession: VerifiedPatientSession,
  ): Promise<RegistrationRequestListItem[]> {
    const requests = await this.registrationRequests.findAllByPatientIdentity(
      patientSession.patientIdentityId,
    );
    return Promise.all(
      requests.map(async (request) =>
        this.toRegistrationRequestListItemWithIdentity(
          request,
          await this.resolvePracticeName(request.practiceId),
        ),
      ),
    );
  }

  /**
   * Loads a single registration request for the verified patient session.
   * Includes the practice display name.
   */
  async findPatientRegRequestById(
    patientSession: VerifiedPatientSession,
    registrationRequestId: string,
  ): Promise<RegistrationRequestListItem> {
    const request = await this.registrationRequests.findById(
      registrationRequestId,
    );
    if (!request) {
      throw new Error("Registration request not found");
    }
    if (!patientSession.patientIdentityId.equals(request.patientIdentityId)) {
      throw new Error("Session is not valid for this registration request");
    }
    const practiceName = await this.resolvePracticeName(request.practiceId);
    return this.toRegistrationRequestListItemWithIdentity(
      request,
      practiceName,
    );
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

    const fullNamePlain = command.fullName.trim();
    const email = command.email.trim();
    const phoneNumber = command.phoneNumber.trim();
    const residentialAddress = command.residentialAddress.trim();
    if (!fullNamePlain) {
      throw new Error("Full name is required");
    }
    if (!email || !phoneNumber || !residentialAddress) {
      throw new Error(
        "Email, phone number, and residential address are required",
      );
    }

    const [encEmail, encPhone, encAddress, encFullName] = await Promise.all([
      EncryptedValue.create(email, this.encrypter),
      EncryptedValue.create(phoneNumber, this.encrypter),
      EncryptedValue.create(residentialAddress, this.encrypter),
      EncryptedValue.create(fullNamePlain, this.encrypter),
    ]);

    request.submit(patientIdentityId);

    const existing =
      await this.registrationDocuments.findByRegistrationRequestId(request.id);
    if (existing) {
      const submittedAt = new Date();
      await this.registrationDocuments.update(
        existing.id,
        new UpdateRegistrationDocument(
          encEmail,
          encPhone,
          encAddress,
          encFullName,
          submittedAt,
        ),
      );
    } else {
      await this.registrationDocuments.create(
        new DraftRegistrationDocument(
          request.id,
          request.patientIdentityId,
          encEmail,
          encPhone,
          encAddress,
          encFullName,
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

    const practiceName = await this.resolvePracticeName(request.practiceId);

    return {
      registrationRequestId: request.id,
      registrationRequestStatus: request.getStatus().toString(),
      practiceName,
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

    const patientIdentity = await this.patientIdentities.findById(hashed);
    if (patientIdentity) {
      const { email, phone, fullName } = patientIdentity;

      await this.patientRecords.ensureFromIdentity(
        new DraftPatientRecord(hashed, email, phone, fullName),
      );
    }

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

  /**
   * Returns decrypted contact details for the patient associated with a
   * {@link VerifiedPatientSession} (e.g. from the patient session guard).
   */
  async getPatientDetailsForSession(
    patientSession: VerifiedPatientSession,
  ): Promise<PatientSessionDetails> {
    const record = await this.patientRecords.findByPatientIdentity(
      patientSession.patientIdentityId,
    );
    if (!record) {
      throw new Error("Patient not found");
    }

    const [email, phone, residentialAddress] = await Promise.all([
      record.email?.decrypt(this.encrypter),
      record.phoneNumber?.decrypt(this.encrypter),
      record.residentialAddress?.decrypt(this.encrypter),
    ]);

    return {
      email,
      phone,
      residentialAddress,
    };
  }

  private toPracticeResult(practice: Practice): PracticeResult {
    return {
      id: practice.id,
      name: practice.name,
    };
  }

  private async resolvePracticeName(
    practiceId: Practice["id"],
  ): Promise<string> {
    const practice = await this.practices.findById(practiceId);
    if (!practice) {
      throw new Error("Practice not found.");
    }
    return practice.name;
  }

  private toRegistrationRequestListItem(
    request: RegistrationRequest,
    practiceName: string,
    patientName?: string | null,
  ): RegistrationRequestListItem {
    const rejectionReason = request.getRejectionReason();
    return {
      registrationRequestId: request.id,
      registrationRequestStatus: request.getStatus().toString(),
      practiceName,
      rejectionReason,
      patientName: patientName ?? null,
    };
  }

  private async toRegistrationRequestListItemWithIdentity(
    request: RegistrationRequest,
    practiceName: string,
  ): Promise<RegistrationRequestListItem> {
    const identity = await this.patientIdentities.findById(
      request.patientIdentityId,
    );
    let patientName: string | null = null;
    if (identity?.fullName) {
      patientName = (await identity.fullName.decrypt(this.encrypter)) ?? null;
    }
    return this.toRegistrationRequestListItem(
      request,
      practiceName,
      patientName,
    );
  }
}
