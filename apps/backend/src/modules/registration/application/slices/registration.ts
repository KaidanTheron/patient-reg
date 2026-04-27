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
  VerifyLinkOutcome,
} from "~/modules/registration/domain/entities/registration-link.entity";
import { PatientSessionTokenSigner } from "~/modules/registration/domain/ports/patient-session-token.signer";
import { HashedRsaId } from "~/modules/registration/domain/value-objects/hashed-rsaid";
import { RsaIdNumber } from "~/modules/registration/domain/value-objects/rsaid";
import { Hasher } from "~/modules/registration/domain/ports/hasher";
import { RegistrationLinkRepository } from "~/modules/registration/domain/ports/registration-link.repository";
import { Encrypter } from "~/modules/registration/domain/ports/encrypter";
import { DraftPatientPractice } from "~/modules/registration/domain/entities/patient-practice.entity";
import { PatientPracticeRepository } from "~/modules/registration/domain/ports/patient-practice.repository";
import { RegistrationDocumentRepository } from "~/modules/registration/domain/ports/registration-document.repository";
import {
  DraftRegistrationDocument,
  RegistrationDocument,
  UpdateRegistrationDocument,
} from "~/modules/registration/domain/entities/registration-document.entity";
import {
  DraftPatientRecord,
  UpdatePatientRecord,
} from "~/modules/registration/domain/entities/patient-record.entity";
import { type VerifiedPatientSession } from "~/modules/registration/application/support/protected-patient-session";
import { type VerifiedPracticeSession } from "~/modules/registration/application/support/verified-practice-session";
import { formatLocalDateAsIsoDate } from "~/common/date";
import {
  ContactDetails,
  MedicalAidDetails,
  MedicalHistory,
  PersonalInformation,
} from "~/modules/registration/domain/value-objects";
import { MAX_ATTEMPTS } from "../../domain/constants/registration-link.constants";

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

export type RejectRegistrationCommand = {
  /** Set from GraphQL `PracticeSessionGuard` / `@PracticeSession()`. */
  practiceSession: VerifiedPracticeSession;
  registrationRequestId: string;
  rejectedByStaffId: string;
  reason: string;
};

export type RejectRegistrationResult = {
  registrationRequestId: string;
  registrationRequestStatus: string;
  practiceName: string;
  rejectionReason: string;
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
  contactDetails: {
    email?: string;
    phone?: string;
    altphone?: string;
    residentialAddress?: string;
  };
  personalInformation: {
    firstname?: string;
    lastname?: string;
    /** ISO date `YYYY-MM-DD` (e.g. from `dateOfBirthFromRsaId` or manual entry). */
    dateOfBirth?: string;
    gender?: string;
  };
  medicalAidDetails: {
    scheme?: string;
    memberNumber?: string;
    mainMember?: string;
    mainMemberId?: string;
    dependantCode?: string;
  };
  medicalHistory: {
    allergies?: string;
    currentMedication?: string;
    chronicConditions?: string;
    previousSurgeries?: string;
    familyHistory?: string;
  };
};

export type SubmitRegistrationDocumentResult = {
  registrationRequestId: string;
  registrationRequestStatus: string;
  practiceName: string;
};

type PatientProfile = Omit<Awaited<ReturnType<RegistrationDocument["decrypt"]>>, "registrationRequestId" | "submittedAt">;

// /** Flat decrypted patient profile fields shared across session-facing DTOs. */
// type FlatPatientProfile = {
//   // ContactDetails
//   email?: string;
//   phone?: string;
//   altphone?: string;
//   residentialAddress?: string;
//   // PersonalInformation
//   firstname?: string;
//   lastname?: string;
//   dateOfBirth?: string;
//   gender?: string;
//   // MedicalAidDetails
//   scheme?: string;
//   memberNumber?: string;
//   mainMember?: string;
//   mainMemberId?: string;
//   dependantCode?: string;
//   // MedicalHistory
//   allergies?: string;
//   currentMedication?: string;
//   chronicConditions?: string;
//   previousSurgeries?: string;
//   familyHistory?: string;
// };

/** Decrypted fields from the submitted registration document; absent when not yet submitted. */
export type SubmittedDocumentDetails = PatientProfile & { submittedAt: Date };

/** Decrypted fields from the patient identity row. */
export type PatientIdentityDetails = {
  firstname?: string | null;
  lastname?: string | null;
  email?: string | null;
  phone?: string | null;
};

export type RegistrationRequestListItem = {
  registrationRequestId: string;
  registrationRequestStatus: string;
  rejectionReason?: string;
  practiceName: string;
  patient?: PatientIdentityDetails | null;
  /** Decrypted registration document; absent when not yet submitted. */
  document?: SubmittedDocumentDetails | null;
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

/** Decrypted profile fields for the session's patient; sourced from the canonical patient record. */
export type PatientDetailsForAuthorizedSession = PatientProfile;

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
    const request = await this.findRequestForPractice(
      command.registrationRequestId,
      command.practiceSession.practiceId,
    );

    request.approve();

    await this.registrationRequests.update(
      command.registrationRequestId,
      new UpdateRegistrationRequest(
        request.getStatus(),
        request.getRejectionReason(),
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

      await this.patientRecords.ensureFromIdentity(
        new DraftPatientRecord(
          request.patientIdentityId,
          ContactDetails.create(identity),
          PersonalInformation.create({}),
          MedicalAidDetails.create({}),
          MedicalHistory.create({}),
        ),
      );
    }

    await this.patientRecords.update(
      request.patientIdentityId,
      new UpdatePatientRecord(
        document.contactDetails,
        document.personalInformation,
        document.medicalAidDetails,
        document.medicalHistory,
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

  async rejectRegistration(
    command: RejectRegistrationCommand,
  ): Promise<RejectRegistrationResult> {
    const request = await this.findRequestForPractice(
      command.registrationRequestId,
      command.practiceSession.practiceId,
    );

    request.reject(command.reason);

    await this.registrationRequests.update(
      command.registrationRequestId,
      new UpdateRegistrationRequest(
        request.getStatus(),
        request.getRejectionReason(),
      ),
    );

    const identity = await this.patientIdentities.findById(
      request.patientIdentityId,
    );
    if (identity) {
      const rawEmail = await identity.email?.decrypt(this.encrypter);
      const rawPhone = await identity.phone?.decrypt(this.encrypter);
      const recipient = rawEmail ?? rawPhone;
      if (recipient) {
        await this.notifier.notify(
          recipient,
          `Your registration request (${request.id}) has been rejected. Reason: ${command.reason}.`,
        );
      }
    }

    const practiceName = await this.resolvePracticeName(request.practiceId);

    return {
      registrationRequestId: request.id,
      registrationRequestStatus: request.getStatus().toString(),
      practiceName,
      rejectionReason: request.getRejectionReason()!,
    };
  }

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
    const practice = await this.practices.create(command.name);
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
   * Loads a single registration request for the verified practice session.
   * Throws {@link ForbiddenException} when the request belongs to a different practice.
   */
  async findPracticeRegRequestById(
    practiceSession: VerifiedPracticeSession,
    registrationRequestId: string,
  ): Promise<RegistrationRequestListItem> {
    const request = await this.findRequestForPractice(
      registrationRequestId,
      practiceSession.practiceId,
    );
    const practice = await this.practices.findById(practiceSession.practiceId);
    if (!practice) {
      throw new Error("Practice not found.");
    }
    return this.toRegistrationRequestListItemWithIdentity(request, practice.name);
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
    const request = await this.findRequestForPatient(
      registrationRequestId,
      patientSession.patientIdentityId,
    );
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
    const request = await this.findRequestForPatient(
      command.registrationRequestId,
      patientIdentityId,
    );

    const { contactDetails: cd, personalInformation: pi } = command;
    const { medicalAidDetails: ma, medicalHistory: mh } = command;

    const profileParams = {
      contactDetails: { email: cd.email, phone: cd.phone, altphone: cd.altphone, address: cd.residentialAddress },
      personalInformation: { ...pi },
      medicalAidDetails: { ...ma },
      medicalHistory: { ...mh },
    };

    request.submit(patientIdentityId);

    const existing =
      await this.registrationDocuments.findByRegistrationRequestId(request.id);
    if (existing) {
      await this.registrationDocuments.update(
        existing.id,
        await UpdateRegistrationDocument.fromRaw(
          { ...profileParams, submittedAt: new Date() },
          this.encrypter,
        ),
      );
    } else {
      await this.registrationDocuments.create(
        await DraftRegistrationDocument.fromRaw(
          { ...profileParams, registrationRequestId: request.id, patientIdentityId: request.patientIdentityId },
          this.encrypter,
        ),
      );
    }

    await this.registrationRequests.update(
      request.id,
      new UpdateRegistrationRequest(
        request.getStatus(),
        request.getRejectionReason(),
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

    const identity = RsaIdNumber.create(command.rsaId);
    const hashed = await HashedRsaId.create(identity, this.hasher);

    const outcome: VerifyLinkOutcome = link.verify(hashed);

    if (!outcome.success) {
      if (
        outcome.errorCode === "IDENTITY_MISMATCH" ||
        outcome.errorCode === "ATTEMPTS_EXHAUSTED"
      ) {
        await this.registrationLinks.update(
          link.id,
          new UpdateRegistrationLink(link.getStatus(), link.getAttempts()),
        );
      }
      return {
        success: false,
        errorCode: outcome.errorCode,
        maxAttempts: link.maxAttempts,
        attemptsAfterFailure: outcome.attemptsAfterFailure,
      };
    }

    const patientIdentity = await this.patientIdentities.findById(hashed);
    if (patientIdentity) {
      const { email, phone, firstname, lastname } = patientIdentity;

      await this.patientRecords.ensureFromIdentity(
        new DraftPatientRecord(
          hashed,
          ContactDetails.create({ email, phone }),
          PersonalInformation.create({ firstname, lastname }),
          MedicalAidDetails.create({}),
          MedicalHistory.create({}),
        ),
      );
    }

    const sessionToken = this.patientSessionTokenSigner.sign({
      registrationLinkId: link.id,
      expiresAt: link.expiresAt,
    });

    return {
      success: true,
      sessionToken,
      expiresAt: link.expiresAt.toISOString(),
      registrationLinkId: link.id,
    };
  }

  /**
   * Returns decrypted patient details. Accepts either:
   * - a {@link VerifiedPatientSession} — the patient sees their own record, or
   * - a {@link VerifiedPracticeSession} + `registrationRequestId` — staff see the
   *   record for a request that belongs to their practice.
   */
  async getPatientDetailsForSession(
    session:
      | { kind: "patient"; patientSession: VerifiedPatientSession }
      | {
          kind: "practice";
          practiceSession: VerifiedPracticeSession;
          registrationRequestId: string;
        },
  ): Promise<PatientDetailsForAuthorizedSession> {
    let patientIdentityId: HashedRsaId;

    if (session.kind === "patient") {
      patientIdentityId = session.patientSession.patientIdentityId;
    } else {
      const request = await this.findRequestForPractice(
        session.registrationRequestId,
        session.practiceSession.practiceId,
      );
      patientIdentityId = request.patientIdentityId;
    }

    const record = await this.patientRecords.findByPatientIdentity(
      patientIdentityId,
    );
    if (!record) {
      throw new Error("Patient not found");
    }

    return await record.decrypt(this.encrypter);
  }

  /**
   * Returns the date of birth implied by a valid RSA ID as a **calendar** date
   * in `YYYY-MM-DD` (local date components; avoids UTC shift from `toISOString()`).
   */
  deriveDateOfBirthFromRsaId(identity: string): string {
    const rsaId = RsaIdNumber.create(identity);
    const d = rsaId.deriveDateOfBirth();
    return formatLocalDateAsIsoDate(d);
  }

  /**
   * Returns the gender implied by a valid RSA ID as `"MALE"` or `"FEMALE"`.
   */
  deriveGenderFromRsaId(identity: string): string {
    const rsaId = RsaIdNumber.create(identity);
    return rsaId.deriveGender().toString();
  }

  private async findRequestForPractice(
    requestId: string,
    practiceId: string,
  ): Promise<RegistrationRequest> {
    const request = await this.registrationRequests.findById(requestId);
    if (!request) {
      throw new Error("Registration request not found");
    }
    if (request.practiceId !== practiceId) {
      throw new ForbiddenException(
        "Registration request does not belong to this practice",
      );
    }
    return request;
  }

  private async findRequestForPatient(
    requestId: string,
    patientIdentityId: HashedRsaId,
  ): Promise<RegistrationRequest> {
    const request = await this.registrationRequests.findById(requestId);
    if (!request) {
      throw new Error("Registration request not found");
    }
    if (!patientIdentityId.equals(request.patientIdentityId)) {
      throw new Error("Session is not valid for this registration request");
    }
    return request;
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
    patient?: PatientIdentityDetails | null,
    document?: SubmittedDocumentDetails | null,
  ): RegistrationRequestListItem {
    const rejectionReason = request.getRejectionReason();
    return {
      registrationRequestId: request.id,
      registrationRequestStatus: request.getStatus().toString(),
      practiceName,
      rejectionReason,
      patient: patient,
      document: document,
    };
  }

  private async toRegistrationRequestListItemWithIdentity(
    request: RegistrationRequest,
    practiceName: string,
  ): Promise<RegistrationRequestListItem> {
    const [identity, doc] = await Promise.all([
      this.patientIdentities.findById(request.patientIdentityId),
      this.registrationDocuments.findByRegistrationRequestId(request.id),
    ]);

    let patient: PatientIdentityDetails | null = null;
    if (identity) {
      const [firstname, lastname, email, phone] = await Promise.all([
        identity.firstname?.decrypt(this.encrypter),
        identity.lastname?.decrypt(this.encrypter),
        identity.email?.decrypt(this.encrypter),
        identity.phone?.decrypt(this.encrypter),
      ]);
      patient = { firstname, lastname, email, phone };
    }

    const document = doc ? await doc.decrypt(this.encrypter) : null;

    return this.toRegistrationRequestListItem(request, practiceName, patient, document);
  }
}
