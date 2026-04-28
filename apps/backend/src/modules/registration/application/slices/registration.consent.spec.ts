import { ForbiddenException } from "@nestjs/common";
import { RegistrationService } from "./registration";
import { HashedRsaId } from "~/modules/registration/domain/value-objects/hashed-rsaid";
import { RegistrationRequest } from "~/modules/registration/domain/entities/registration-request.entity";
import { RegistrationStatus } from "~/modules/registration/domain/value-objects/registration-status";
import { ConsentRecord } from "~/modules/registration/domain/entities/consent-record.entity";
import { ConsentTemplate } from "~/modules/registration/domain/entities/consent-template.entity";
import { Practice } from "~/modules/registration/domain/entities/practice.entity";
import type { VerifiedPatientSession } from "~/modules/registration/application/support/protected-patient-session";

// ── Shared test fixtures ──────────────────────────────────────────────────────

const PATIENT_ID = HashedRsaId.fromPersisted("hashed-patient-a");
const OTHER_PATIENT_ID = HashedRsaId.fromPersisted("hashed-patient-b");
const PRACTICE_ID = "practice-1";
const REQUEST_ID = "req-1";
const TEMPLATE_ID = "template-1";
const RECORD_ID = "record-1";

const patientSession: VerifiedPatientSession = {
  registrationLinkId: "link-1",
  patientIdentityId: PATIENT_ID,
  registrationLink: null as any,
};

function makeRequest(patientIdentityId = PATIENT_ID, status = RegistrationStatus.awaitingCompletion()) {
  return new RegistrationRequest(REQUEST_ID, patientIdentityId, PRACTICE_ID, status);
}

function makeConsentTemplate(): ConsentTemplate {
  return new ConsentTemplate(
    TEMPLATE_ID,
    PRACTICE_ID,
    "REGISTRATION",
    "1.0",
    "I consent to my data being used for registration.",
    true,
    new Date("2025-01-01"),
  );
}

function makeConsentRecord(): ConsentRecord {
  return new ConsentRecord(
    RECORD_ID,
    REQUEST_ID,
    PATIENT_ID,
    TEMPLATE_ID,
    new Date("2025-06-01T10:00:00.000Z"),
  );
}

// ── Mock factory ──────────────────────────────────────────────────────────────

function makeMocks() {
  return {
    registrationRequests: {
      findById: jest.fn(),
      findByPatientAndPractice: jest.fn(),
      findAllByPracticeId: jest.fn(),
      findAllByPatientIdentity: jest.fn(),
      create: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
    },
    registrationLinks: {
      findById: jest.fn(),
      revokeActiveForPatient: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    patientIdentities: { findById: jest.fn() },
    patientRecords: {
      findByPatientIdentity: jest.fn(),
      ensureFromIdentity: jest.fn(),
      update: jest.fn(),
    },
    practices: {
      findById: jest.fn().mockResolvedValue(new Practice(PRACTICE_ID, "Test Practice")),
      findAll: jest.fn(),
      create: jest.fn(),
    },
    patientPractices: { ensureLinked: jest.fn() },
    registrationDocuments: {
      findByRegistrationRequestId: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({}),
      update: jest.fn(),
    },
    notifier: { notify: jest.fn() },
    hasher: { hash: jest.fn() },
    encrypter: {
      encrypt: jest.fn().mockResolvedValue("encrypted-value"),
      decrypt: jest.fn(),
    },
    registrationLinkTokenSigner: { sign: jest.fn(), verify: jest.fn() },
    patientSessionTokenSigner: { sign: jest.fn(), verify: jest.fn() },
    registrationLinkFormatter: { format: jest.fn() },
    consentTemplates: {
      findActiveByPracticeAndType: jest.fn(),
      create: jest.fn(),
    },
    consentRecords: {
      findByRegistrationRequestId: jest.fn(),
      create: jest.fn(),
    },
  };
}

type Mocks = ReturnType<typeof makeMocks>;

function makeService(mocks: Mocks): RegistrationService {
  return new RegistrationService(
    mocks.registrationRequests as any,
    mocks.registrationLinks as any,
    mocks.patientIdentities as any,
    mocks.patientRecords as any,
    mocks.practices as any,
    mocks.patientPractices as any,
    mocks.registrationDocuments as any,
    mocks.notifier as any,
    mocks.hasher as any,
    mocks.encrypter as any,
    mocks.registrationLinkTokenSigner as any,
    mocks.patientSessionTokenSigner as any,
    mocks.registrationLinkFormatter as any,
    mocks.consentTemplates as any,
    mocks.consentRecords as any,
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("RegistrationService — consent", () => {
  describe("submitRegistrationDocument", () => {
    it("throws ForbiddenException when no consent record exists for the request", async () => {
      const mocks = makeMocks();
      mocks.registrationRequests.findById.mockResolvedValue(makeRequest());
      mocks.consentRecords.findByRegistrationRequestId.mockResolvedValue(null);

      const service = makeService(mocks);

      await expect(
        service.submitRegistrationDocument({
          patientSession,
          registrationRequestId: REQUEST_ID,
          contactDetails: { email: "patient@example.com" },
          personalInformation: {},
          medicalAidDetails: {},
          medicalHistory: {},
        }),
      ).rejects.toThrow(ForbiddenException);

      await expect(
        service.submitRegistrationDocument({
          patientSession,
          registrationRequestId: REQUEST_ID,
          contactDetails: { email: "patient@example.com" },
          personalInformation: {},
          medicalAidDetails: {},
          medicalHistory: {},
        }),
      ).rejects.toThrow("Consent must be given before submitting registration");
    });

    it("proceeds past the consent check and submits when a consent record exists", async () => {
      const mocks = makeMocks();
      mocks.registrationRequests.findById.mockResolvedValue(makeRequest());
      mocks.consentRecords.findByRegistrationRequestId.mockResolvedValue(makeConsentRecord());

      const service = makeService(mocks);

      const result = await service.submitRegistrationDocument({
        patientSession,
        registrationRequestId: REQUEST_ID,
        contactDetails: { email: "patient@example.com" },
        personalInformation: {},
        medicalAidDetails: {},
        medicalHistory: {},
      });

      expect(result.registrationRequestId).toBe(REQUEST_ID);
      expect(result.registrationRequestStatus).toBe("AWAITING_REVIEW");
      expect(result.practiceName).toBe("Test Practice");
      expect(mocks.registrationRequests.update).toHaveBeenCalledTimes(1);
    });

    it("does not call registrationDocuments.create when consent check fails", async () => {
      const mocks = makeMocks();
      mocks.registrationRequests.findById.mockResolvedValue(makeRequest());
      mocks.consentRecords.findByRegistrationRequestId.mockResolvedValue(null);

      const service = makeService(mocks);

      await expect(
        service.submitRegistrationDocument({
          patientSession,
          registrationRequestId: REQUEST_ID,
          contactDetails: { email: "patient@example.com" },
          personalInformation: {},
          medicalAidDetails: {},
          medicalHistory: {},
        }),
      ).rejects.toThrow(ForbiddenException);

      expect(mocks.registrationDocuments.create).not.toHaveBeenCalled();
    });
  });

  describe("giveConsent", () => {
    it("creates and returns a consent record when none exists", async () => {
      const mocks = makeMocks();
      mocks.registrationRequests.findById.mockResolvedValue(makeRequest());
      mocks.consentRecords.findByRegistrationRequestId.mockResolvedValue(null);
      mocks.consentTemplates.findActiveByPracticeAndType.mockResolvedValue(makeConsentTemplate());
      mocks.consentRecords.create.mockResolvedValue(makeConsentRecord());

      const service = makeService(mocks);
      const result = await service.giveConsent(patientSession, REQUEST_ID);

      expect(mocks.consentRecords.create).toHaveBeenCalledTimes(1);
      expect(result.id).toBe(RECORD_ID);
      expect(result.registrationRequestId).toBe(REQUEST_ID);
      expect(result.consentTemplateId).toBe(TEMPLATE_ID);
      expect(result.givenAt).toBe("2025-06-01T10:00:00.000Z");
    });

    it("is idempotent — returns the existing record without creating a new one", async () => {
      const mocks = makeMocks();
      mocks.registrationRequests.findById.mockResolvedValue(makeRequest());
      mocks.consentRecords.findByRegistrationRequestId.mockResolvedValue(makeConsentRecord());

      const service = makeService(mocks);
      const result = await service.giveConsent(patientSession, REQUEST_ID);

      expect(mocks.consentRecords.create).not.toHaveBeenCalled();
      expect(result.id).toBe(RECORD_ID);
    });

    it("throws when the request does not belong to the patient session", async () => {
      const mocks = makeMocks();
      mocks.registrationRequests.findById.mockResolvedValue(
        makeRequest(OTHER_PATIENT_ID),
      );

      const service = makeService(mocks);

      await expect(
        service.giveConsent(patientSession, REQUEST_ID),
      ).rejects.toThrow("Session is not valid for this registration request");
    });

    it("throws when no active consent template is found for the practice", async () => {
      const mocks = makeMocks();
      mocks.registrationRequests.findById.mockResolvedValue(makeRequest());
      mocks.consentRecords.findByRegistrationRequestId.mockResolvedValue(null);
      mocks.consentTemplates.findActiveByPracticeAndType.mockResolvedValue(null);

      const service = makeService(mocks);

      await expect(
        service.giveConsent(patientSession, REQUEST_ID),
      ).rejects.toThrow("No active consent template found for this practice");
    });
  });

  describe("getConsentTemplate", () => {
    it("returns the active consent template for the practice linked to the request", async () => {
      const mocks = makeMocks();
      mocks.registrationRequests.findById.mockResolvedValue(makeRequest());
      mocks.consentTemplates.findActiveByPracticeAndType.mockResolvedValue(
        makeConsentTemplate(),
      );

      const service = makeService(mocks);
      const result = await service.getConsentTemplate(patientSession, REQUEST_ID);

      expect(mocks.consentTemplates.findActiveByPracticeAndType).toHaveBeenCalledWith(
        PRACTICE_ID,
        "REGISTRATION",
      );
      expect(result.id).toBe(TEMPLATE_ID);
      expect(result.consentType).toBe("REGISTRATION");
      expect(result.version).toBe("1.0");
      expect(result.text).toBe("I consent to my data being used for registration.");
    });

    it("throws when no active template exists for the practice", async () => {
      const mocks = makeMocks();
      mocks.registrationRequests.findById.mockResolvedValue(makeRequest());
      mocks.consentTemplates.findActiveByPracticeAndType.mockResolvedValue(null);

      const service = makeService(mocks);

      await expect(
        service.getConsentTemplate(patientSession, REQUEST_ID),
      ).rejects.toThrow("No active consent template found for this practice");
    });

    it("throws when the request does not belong to the patient session", async () => {
      const mocks = makeMocks();
      mocks.registrationRequests.findById.mockResolvedValue(
        makeRequest(OTHER_PATIENT_ID),
      );

      const service = makeService(mocks);

      await expect(
        service.getConsentTemplate(patientSession, REQUEST_ID),
      ).rejects.toThrow("Session is not valid for this registration request");
    });
  });

  describe("getMyConsentRecord", () => {
    it("returns null when no consent record exists", async () => {
      const mocks = makeMocks();
      mocks.registrationRequests.findById.mockResolvedValue(makeRequest());
      mocks.consentRecords.findByRegistrationRequestId.mockResolvedValue(null);

      const service = makeService(mocks);
      const result = await service.getMyConsentRecord(patientSession, REQUEST_ID);

      expect(result).toBeNull();
    });

    it("returns the consent record when one exists", async () => {
      const mocks = makeMocks();
      mocks.registrationRequests.findById.mockResolvedValue(makeRequest());
      mocks.consentRecords.findByRegistrationRequestId.mockResolvedValue(makeConsentRecord());

      const service = makeService(mocks);
      const result = await service.getMyConsentRecord(patientSession, REQUEST_ID);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(RECORD_ID);
      expect(result!.registrationRequestId).toBe(REQUEST_ID);
    });
  });
});
