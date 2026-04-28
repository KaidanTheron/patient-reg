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
  RegistrationRequest,
} from "~/modules/registration/domain/entities/registration-request.entity";
import { PatientSessionTokenSigner } from "~/modules/registration/domain/ports/patient-session-token.signer";
import { HashedRsaId } from "~/modules/registration/domain/value-objects/hashed-rsaid";
import { RsaIdNumber } from "~/modules/registration/domain/value-objects/rsaid";
import { Hasher } from "~/modules/registration/domain/ports/hasher";
import { RegistrationLinkRepository } from "~/modules/registration/domain/ports/registration-link.repository";
import { Encrypter } from "~/modules/registration/domain/ports/encrypter";
import { PatientPracticeRepository } from "~/modules/registration/domain/ports/patient-practice.repository";
import { RegistrationDocumentRepository } from "~/modules/registration/domain/ports/registration-document.repository";
import {
  DraftRegistrationDocument,
  RegistrationDocument,
  UpdateRegistrationDocument,
} from "~/modules/registration/domain/entities/registration-document.entity";
import { type VerifiedPatientSession } from "~/modules/registration/application/support/protected-patient-session";
import { type VerifiedPracticeSession } from "~/modules/registration/application/support/verified-practice-session";
import { formatLocalDateAsIsoDate } from "~/common/date";
import { MAX_ATTEMPTS } from "../../domain/constants/registration-link.constants";
import { ConsentTemplateRepository } from "~/modules/registration/domain/ports/consent-template.repository";
import { ConsentRecordRepository } from "~/modules/registration/domain/ports/consent-record.repository";
import { DraftConsentRecord } from "~/modules/registration/domain/entities/consent-record.entity";
import {
  approveRegistration as approveRegistrationService,
  rejectRegistration as rejectRegistrationService,
  initiateRegistration as initiateRegistrationService,
  submitRegistrationDocument as submitRegistrationDocumentService,
  verifyRegistration as verifyRegistrationService,
} from "~/modules/registration/domain/services";

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

export type ConsentTemplateResult = {
  id: string;
  consentType: string;
  version: string;
  text: string;
};

export type ConsentRecordResult = {
  id: string;
  registrationRequestId: string;
  consentTemplateId: string;
  givenAt: string;
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
    private readonly consentTemplates: ConsentTemplateRepository,
    private readonly consentRecords: ConsentRecordRepository,
  ) {}

  async approveRegistration(
    command: ApproveRegistrationCommand,
  ): Promise<ApproveRegistrationResult> {
    const request = await this.findRequestForPractice(
      command.registrationRequestId,
      command.practiceSession.practiceId,
    );

    const [document, patient, practice] = await Promise.all([
      this.registrationDocuments.findByRegistrationRequestId(request.id),
      this.patientRecords.findByPatientIdentity(request.patientIdentityId),
      this.practices.findById(request.practiceId),
    ]);

    const effects = approveRegistrationService({
      request,
      document,
      patient,
      practice,
    });

    await Promise.all([
      this.registrationRequests.update(command.registrationRequestId, effects.updatedRequest),
      this.patientRecords.update(request.patientIdentityId, effects.updatedPatient),
      this.patientPractices.ensureLinked(effects.patientPracticeLink),
    ]);

    return {
      registrationRequestId: request.id,
      registrationRequestStatus: request.getStatus().toString(),
      practiceName: effects.practice.name,
    };
  }

  async rejectRegistration(
    command: RejectRegistrationCommand,
  ): Promise<RejectRegistrationResult> {
    const request = await this.findRequestForPractice(
      command.registrationRequestId,
      command.practiceSession.practiceId,
    );

    const [practice, patient] = await Promise.all([
      this.practices.findById(request.practiceId),
      this.patientIdentities.findById(request.patientIdentityId),
    ]);

    const effects = rejectRegistrationService({
      request,
      reason: command.reason,
      practice,
      patient,
    });

    const [rawEmail, rawPhone] = await Promise.all([
      effects.patient.email?.decrypt(this.encrypter),
      effects.patient.phone?.decrypt(this.encrypter),
      this.registrationRequests.update(command.registrationRequestId, effects.updatedRequest)
    ])

    const recipient = rawEmail ?? rawPhone!; // one of email or phone will be defined as per business rules
    await this.notifier.notify(
      recipient,
      `Your registration request (${request.id}) has been rejected. Reason: ${command.reason}.`,
    );

    return {
      registrationRequestId: request.id,
      registrationRequestStatus: request.getStatus().toString(),
      practiceName: effects.practice.name,
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

    const [patient, practice, existingRequest] = await Promise.all([
      this.patientIdentities.findById(hashedIdentity),
      this.practices.findById(practiceId),
      this.registrationRequests.findByPatientAndPractice(hashedIdentity, practiceId),
    ]);

    const effects = initiateRegistrationService({
      patient,
      practice,
      existingRequest,
      hashedIdentity,
      initiatedByStaffId,
    });

    const [created, link, rawEmail, rawPhone] = await Promise.all([
      this.registrationRequests.create(effects.draftRequest),
      this.registrationLinks.create(effects.draftLink),
      effects.patient.email?.decrypt(this.encrypter),
      effects.patient.phone?.decrypt(this.encrypter),   
    ]);

    const token = this.registrationLinkTokenSigner.sign({
      registrationLinkId: link.id,
      expiresAt: link.expiresAt,
    });
    const sendableUrl = this.registrationLinkFormatter.format(token);
    await this.notifier.notify(
      rawEmail ?? rawPhone!, // one of the two will be defined as per business rules
      `Open ${sendableUrl} in your browser to continue registration (request ${created.id}).`,
    );

    return {
      registrationRequestId: created.id,
      registrationRequestStatus: created.getStatus().toString(),
      practiceName: effects.practice.name,
    };
  }

  async findPracticeById(id: Practice["id"]): Promise<PracticeResult | null> {
    const practice = await this.practices.findById(id);
    return practice ? this.toPracticeResult(practice) : null;
  }

  async findPractices(): Promise<PracticeResult[]> {
    const list = await this.practices.findAll();
    return list.map((p) => this.toPracticeResult(p));
  }

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

    const [consent, existingDocument, practice] = await Promise.all([
      this.consentRecords.findByRegistrationRequestId(request.id),
      this.registrationDocuments.findByRegistrationRequestId(request.id),
      this.practices.findById(request.practiceId),
    ]);

    const effects = submitRegistrationDocumentService({
      request,
      consent,
      existingDocument,
      patientIdentityId,
    });

    const { contactDetails: cd, personalInformation: pi } = command;
    const { medicalAidDetails: ma, medicalHistory: mh } = command;

    const profileParams = {
      contactDetails: { ...cd, address: cd.residentialAddress },
      personalInformation: { ...pi },
      medicalAidDetails: { ...ma },
      medicalHistory: { ...mh },
    };

    if (effects.existingDocumentId) {
      await this.registrationDocuments.update(
        effects.existingDocumentId,
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

    await this.registrationRequests.update(request.id, effects.updatedRequest);

    return {
      registrationRequestId: request.id,
      registrationRequestStatus: request.getStatus().toString(),
      practiceName: practice?.name ?? "",
    };
  }

  /**
   * Returns the active consent template for the practice linked to the given
   * registration request. Validates that the request belongs to the patient session.
   */
  async getConsentTemplate(
    patientSession: VerifiedPatientSession,
    registrationRequestId: string,
  ): Promise<ConsentTemplateResult> {
    const request = await this.findRequestForPatient(
      registrationRequestId,
      patientSession.patientIdentityId,
    );
    const template = await this.consentTemplates.findActiveByPracticeAndType(
      request.practiceId,
      "REGISTRATION",
    );
    if (!template) {
      throw new Error("No active consent template found for this practice");
    }
    return {
      id: template.id,
      consentType: template.consentType,
      version: template.version,
      text: template.text,
    };
  }

  /**
   * Returns the existing consent record for a registration request if one has
   * already been given, or null otherwise. Does not create a new record.
   */
  async getMyConsentRecord(
    patientSession: VerifiedPatientSession,
    registrationRequestId: string,
  ): Promise<ConsentRecordResult | null> {
    await this.findRequestForPatient(
      registrationRequestId,
      patientSession.patientIdentityId,
    );
    const record = await this.consentRecords.findByRegistrationRequestId(
      registrationRequestId,
    );
    if (!record) return null;
    return {
      id: record.id,
      registrationRequestId: record.registrationRequestId,
      consentTemplateId: record.consentTemplateId,
      givenAt: record.givenAt.toISOString(),
    };
  }

  /**
   * Records consent for a registration request. Idempotent — returns the
   * existing consent record if the patient has already given consent for this
   * request.
   */
  async giveConsent(
    patientSession: VerifiedPatientSession,
    registrationRequestId: string,
  ): Promise<ConsentRecordResult> {
    const request = await this.findRequestForPatient(
      registrationRequestId,
      patientSession.patientIdentityId,
    );

    const existing = await this.consentRecords.findByRegistrationRequestId(
      registrationRequestId,
    );
    if (existing) {
      return {
        id: existing.id,
        registrationRequestId: existing.registrationRequestId,
        consentTemplateId: existing.consentTemplateId,
        givenAt: existing.givenAt.toISOString(),
      };
    }

    const template = await this.consentTemplates.findActiveByPracticeAndType(
      request.practiceId,
      "REGISTRATION",
    );
    if (!template) {
      throw new Error("No active consent template found for this practice");
    }

    const record = await this.consentRecords.create(
      new DraftConsentRecord(
        registrationRequestId,
        patientSession.patientIdentityId,
        template.id,
      ),
    );
    return {
      id: record.id,
      registrationRequestId: record.registrationRequestId,
      consentTemplateId: record.consentTemplateId,
      givenAt: record.givenAt.toISOString(),
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
    const identity = RsaIdNumber.create(command.rsaId);
    const hashedIdentity = await HashedRsaId.create(identity, this.hasher);

    const [link, patientIdentity] = await Promise.all([
      this.registrationLinks.findById(command.registrationLinkId),
      this.patientIdentities.findById(hashedIdentity),
    ]);

    if (!link) {
      return {
        success: false,
        errorCode: "REGISTRATION_LINK_NOT_FOUND",
        maxAttempts: MAX_ATTEMPTS,
      };
    }

    const effects = verifyRegistrationService({ link, hashedIdentity, patientIdentity });

    await Promise.all([
      effects.updatedLink && this.registrationLinks.update(link.id, effects.updatedLink),
      effects.newPatient && this.patientRecords.ensureFromIdentity(effects.newPatient),
    ]);

    if (!effects.outcome.success) {
      return {
        success: false,
        errorCode: effects.outcome.errorCode,
        maxAttempts: link.maxAttempts,
        attemptsAfterFailure: effects.outcome.attemptsAfterFailure,
      };
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

    const payload = {
      registrationRequestId: request.id,
      registrationRequestStatus: request.getStatus().toString(),
      practiceName,
      rejectionReason,
      patient: patient,
      document: document,
    }

    return payload;
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
