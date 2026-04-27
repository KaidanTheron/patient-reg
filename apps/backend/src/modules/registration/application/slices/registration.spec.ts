import { ForbiddenException } from "@nestjs/common";
import { Practice } from "~/modules/registration/domain/entities/practice.entity";
import {
  DraftRegistrationDocument,
  RegistrationDocument,
  UpdateRegistrationDocument,
} from "~/modules/registration/domain/entities/registration-document.entity";
import {
  DraftPatientPractice,
  PatientPractice,
} from "~/modules/registration/domain/entities/patient-practice.entity";
import {
  DraftRegistrationRequest,
  RegistrationRequest,
  UpdateRegistrationRequest,
} from "~/modules/registration/domain/entities/registration-request.entity";
import {
  DraftRegistrationLink,
  RegistrationLink,
  UpdateRegistrationLink,
} from "~/modules/registration/domain/entities/registration-link.entity";
import { Encrypter } from "~/modules/registration/domain/ports/encrypter";
import { Hasher } from "~/modules/registration/domain/ports/hasher";
import { Notifier } from "~/modules/registration/domain/ports/notifier";
import { PatientIdentityRepository } from "~/modules/registration/domain/ports/patient-identity.repository";
import { PatientRecordRepository } from "~/modules/registration/domain/ports/patient-record.repository";
import { PracticeRepository } from "~/modules/registration/domain/ports/practice.repository";
import { PatientPracticeRepository } from "~/modules/registration/domain/ports/patient-practice.repository";
import { RegistrationLinkFormatter } from "~/modules/registration/domain/ports/registration-link.formatter";
import {
  RegistrationLinkTokenPayload,
  RegistrationLinkTokenSigner,
} from "~/modules/registration/domain/ports/registration-link-token.signer";
import {
  type PatientSessionTokenPayload,
  PatientSessionTokenSigner,
  PATIENT_SESSION_TOKEN_TYPE,
} from "~/modules/registration/domain/ports/patient-session-token.signer";
import { MAX_ATTEMPTS } from "~/modules/registration/domain/constants/registration-link.constants";
import { RegistrationLinkRepository } from "~/modules/registration/domain/ports/registration-link.repository";
import { RegistrationRequestRepository } from "~/modules/registration/domain/ports/registration-request.repository";
import { RegistrationDocumentRepository } from "~/modules/registration/domain/ports/registration-document.repository";
import { PatientIdentity } from "~/modules/registration/domain/entities/patient-identity.entity";
import {
  DraftPatientRecord,
  PatientRecord,
  UpdatePatientRecord,
} from "~/modules/registration/domain/entities/patient-record.entity";
import { EncryptedValue } from "~/modules/registration/domain/value-objects/encrypted-value";
import { HashedRsaId } from "~/modules/registration/domain/value-objects/hashed-rsaid";
import { RegistrationLinkStatus } from "~/modules/registration/domain/value-objects/registration-link-status";
import { RegistrationStatus } from "~/modules/registration/domain/value-objects/registration-status";
import { ProtectedPatientSession } from "~/modules/registration/application/support/protected-patient-session";
import { type VerifiedPracticeSession } from "~/modules/registration/application/support/verified-practice-session";
import { RegistrationService } from "~/modules/registration/application/slices/registration";
class InMemoryRegistrationRequestRepository extends RegistrationRequestRepository {
  readonly requests = new Map<string, RegistrationRequest>();
  readonly updates: Array<{
    id: RegistrationRequest["id"];
    request: Partial<UpdateRegistrationRequest>;
  }> = [];

  async findById(id: string): Promise<RegistrationRequest | null> {
    return this.requests.get(id) ?? null;
  }

  async findByPatientAndPractice(
    patient: RegistrationRequest["patientIdentityId"],
    practice: RegistrationRequest["practiceId"],
  ): Promise<RegistrationRequest | null> {
    return (
      [...this.requests.values()].find(
        (request) =>
          request.patientIdentityId.equals(patient) &&
          request.practiceId === practice,
      ) ?? null
    );
  }

  async findAllByPracticeId(
    practiceId: RegistrationRequest["practiceId"],
  ): Promise<RegistrationRequest[]> {
    return [...this.requests.values()]
      .filter((request) => request.practiceId === practiceId)
      .sort((a, b) => (a.id < b.id ? 1 : a.id > b.id ? -1 : 0));
  }

  async findAllByPatientIdentity(
    patient: RegistrationRequest["patientIdentityId"],
  ): Promise<RegistrationRequest[]> {
    return [...this.requests.values()]
      .filter((request) => request.patientIdentityId.equals(patient))
      .sort((a, b) => (a.id < b.id ? 1 : a.id > b.id ? -1 : 0));
  }

  async create(
    request: DraftRegistrationRequest,
  ): Promise<RegistrationRequest> {
    const created = new RegistrationRequest(
      "registration-1",
      request.patientIdentityId,
      request.practiceId,
      request.status,
      request.rejectionReason,
    );
    this.requests.set(created.id, created);
    return created;
  }

  async update(
    id: RegistrationRequest["id"],
    request: Partial<UpdateRegistrationRequest>,
  ): Promise<void> {
    this.updates.push({ id, request });
  }
}

class InMemoryRegistrationLinkRepository extends RegistrationLinkRepository {
  readonly links = new Map<string, RegistrationLink>();
  readonly revokedPatients: string[] = [];

  async create(link: DraftRegistrationLink): Promise<RegistrationLink> {
    const created = new RegistrationLink(
      "link-1",
      RegistrationLinkStatus.active(),
      link.expiresAt,
      link.patient,
      link.createdByStaffId,
      0,
      link.maxAttempts,
    );
    this.links.set(created.id, created);
    return created;
  }

  async findById(id: string): Promise<RegistrationLink | null> {
    return this.links.get(id) ?? null;
  }

  async findActiveByPatient(
    patient: RegistrationLink["patient"],
  ): Promise<RegistrationLink | null> {
    return (
      [...this.links.values()].find(
        (link) =>
          link.patient.equals(patient) &&
          link.getStatus().equals(RegistrationLinkStatus.active()),
      ) ?? null
    );
  }

  async revokeActiveForPatient(
    patient: RegistrationLink["patient"],
  ): Promise<void> {
    this.revokedPatients.push(patient.toString());
  }

  async update(
    id: RegistrationLink["id"],
    link: UpdateRegistrationLink,
  ): Promise<void> {
    const existing = this.links.get(id);
    if (!existing) {
      return;
    }
    this.links.set(
      id,
      new RegistrationLink(
        existing.id,
        link.getStatus(),
        existing.expiresAt,
        existing.patient,
        existing.createdByStaffId,
        link.getAttempts(),
        existing.maxAttempts,
      ),
    );
  }
}

const TEST_NOTIFIER_RECIPIENT = "t:patient@example.com";

/** Ciphertexts are "t:" + plaintext so tests can build values without real crypto. */
class TestEncrypter extends Encrypter {
  encrypt(plaintext: string): Promise<string> {
    return Promise.resolve(`t:${plaintext}`);
  }

  decrypt(ciphertext: string): Promise<string> {
    if (!ciphertext.startsWith("t:")) {
      return Promise.reject(new Error("Invalid test ciphertext"));
    }
    return Promise.resolve(ciphertext.slice(2));
  }
}

class InMemoryPatientIdentityRepository extends PatientIdentityRepository {
  private fullNameByIdentity = new Map<string, EncryptedValue>();

  constructor(private readonly validPatients = new Set<string>()) {
    super();
  }

  async exists(identity: HashedRsaId): Promise<boolean> {
    return this.validPatients.has(identity.toString());
  }

  async findById(identity: HashedRsaId): Promise<PatientIdentity | null> {
    if (!this.validPatients.has(identity.toString())) {
      return null;
    }
    return new PatientIdentity(
      HashedRsaId.fromPersisted(identity.toString()),
      EncryptedValue.fromPersisted(TEST_NOTIFIER_RECIPIENT),
      undefined,
      this.fullNameByIdentity.get(identity.toString()),
    );
  }

  async updateFullName(identity: HashedRsaId, fullName: string): Promise<void> {
    this.fullNameByIdentity.set(
      identity.toString(),
      EncryptedValue.fromPersisted(`t:${fullName}`),
    );
  }
}

class InMemoryPatientRecordRepository extends PatientRecordRepository {
  readonly byIdentity = new Map<string, PatientRecord>();
  private nextId = 1;

  async findByPatientIdentity(
    patientIdentityId: HashedRsaId,
  ): Promise<PatientRecord | null> {
    return this.byIdentity.get(patientIdentityId.toString()) ?? null;
  }

  async ensureFromIdentity(draft: DraftPatientRecord): Promise<PatientRecord> {
    const k = draft.patientIdentityId.toString();
    const existing = this.byIdentity.get(k);
    if (existing) {
      return existing;
    }
    const created = new PatientRecord(
      `patient-record-${this.nextId++}`,
      draft.patientIdentityId,
      draft.email,
      draft.phoneNumber,
      undefined,
      draft.fullName,
      new Date(0),
    );
    this.byIdentity.set(k, created);
    return created;
  }

  async update(
    patientIdentityId: HashedRsaId,
    update: UpdatePatientRecord,
  ): Promise<PatientRecord> {
    const k = patientIdentityId.toString();
    const existing = this.byIdentity.get(k);
    if (!existing) {
      throw new Error("Patient record not found");
    }
    const next = new PatientRecord(
      existing.id,
      existing.patientIdentityId,
      update.email ?? existing.email,
      update.phoneNumber ?? existing.phoneNumber,
      update.residentialAddress ?? existing.residentialAddress,
      update.fullName !== undefined ? update.fullName : existing.fullName,
      new Date(1),
    );
    this.byIdentity.set(k, next);
    return next;
  }

  async updateFullName(
    patientIdentityId: HashedRsaId,
    fullName: string,
  ): Promise<void> {
    const k = patientIdentityId.toString();
    const existing = this.byIdentity.get(k);
    if (!existing) {
      return;
    }
    const next = new PatientRecord(
      existing.id,
      existing.patientIdentityId,
      existing.email,
      existing.phoneNumber,
      existing.residentialAddress,
      EncryptedValue.fromPersisted(`t:${fullName}`),
      existing.updatedAt,
    );
    this.byIdentity.set(k, next);
  }
}

class InMemoryPracticeRepository extends PracticeRepository {
  readonly practices = new Map<string, Practice>();

  async create(name: Practice["name"]): Promise<Practice> {
    const practice = Practice.create(
      `practice-${this.practices.size + 1}`,
      name,
    );
    this.practices.set(practice.id, practice);
    return practice;
  }

  async findById(id: Practice["id"]): Promise<Practice | null> {
    return this.practices.get(id) ?? null;
  }

  async findAll(): Promise<Practice[]> {
    return [...this.practices.values()];
  }
}

class InMemoryRegistrationDocumentRepository extends RegistrationDocumentRepository {
  readonly byId = new Map<string, RegistrationDocument>();
  private nextId = 1;

  async findByRegistrationRequestId(
    registrationRequestId: string,
  ): Promise<RegistrationDocument | null> {
    return (
      [...this.byId.values()].find(
        (d) => d.registrationRequestId === registrationRequestId,
      ) ?? null
    );
  }

  async create(
    document: DraftRegistrationDocument,
  ): Promise<RegistrationDocument> {
    const id = `doc-${this.nextId++}`;
    const created = new RegistrationDocument(
      id,
      document.registrationRequestId,
      document.patientIdentityId,
      document.email,
      document.phoneNumber,
      document.residentialAddress,
      document.fullName,
      new Date(0),
    );
    this.byId.set(id, created);
    return created;
  }

  async update(
    id: string,
    update: UpdateRegistrationDocument,
  ): Promise<RegistrationDocument> {
    const existing = this.byId.get(id);
    if (!existing) {
      throw new Error("not found");
    }
    const next = new RegistrationDocument(
      id,
      existing.registrationRequestId,
      existing.patientIdentityId,
      update.email,
      update.phoneNumber,
      update.residentialAddress,
      update.fullName,
      update.submittedAt,
    );
    this.byId.set(id, next);
    return next;
  }
}

class InMemoryPatientPracticeRepository extends PatientPracticeRepository {
  /**
   * Key: `${hashedIdentity}|${practiceId}` for idempotent `ensureLinked`.
   */
  readonly byPair = new Map<string, PatientPractice>();
  private nextId = 1;
  private readonly linkCreatedAt = new Date(0);

  private key(draft: DraftPatientPractice): string {
    return `${draft.patientIdentityId.toString()}|${draft.practiceId}`;
  }

  async ensureLinked(draft: DraftPatientPractice): Promise<PatientPractice> {
    const k = this.key(draft);
    const existing = this.byPair.get(k);
    if (existing) {
      return existing;
    }
    const created = new PatientPractice(
      `patient-practice-${this.nextId++}`,
      draft.patientIdentityId,
      draft.practiceId,
      this.linkCreatedAt,
    );
    this.byPair.set(k, created);
    return created;
  }
}

class DeterministicHasher extends Hasher {
  async hash(rawValue: string): Promise<string> {
    return `hashed:${rawValue}`;
  }
}

class SpyNotifier extends Notifier {
  readonly notifications: Array<{ recipient: string; body: string }> = [];

  async notify(recipient: string, body: string): Promise<boolean> {
    this.notifications.push({ recipient, body });
    return true;
  }
}

class FakeRegistrationLinkTokenSigner extends RegistrationLinkTokenSigner {
  readonly signed: Array<{ registrationLinkId: string; expiresAt: Date }> = [];

  sign(params: { registrationLinkId: string; expiresAt: Date }): string {
    this.signed.push(params);
    return `token:${params.registrationLinkId}`;
  }

  verify(token: string): RegistrationLinkTokenPayload {
    if (!token.startsWith("token:")) {
      throw new Error("Invalid link token");
    }
    return { registrationLinkId: token.replace("token:", "") };
  }
}

class FakeRegistrationLinkFormatter extends RegistrationLinkFormatter {
  format(token: string): string {
    return `https://patient-reg.test/registration/${token}`;
  }
}

class FakePatientSessionTokenSigner extends PatientSessionTokenSigner {
  sign(params: { registrationLinkId: string; expiresAt: Date }): string {
    return `sess:${params.registrationLinkId}`;
  }

  verify(token: string): PatientSessionTokenPayload {
    if (!token.startsWith("sess:")) {
      throw new Error("Invalid session token");
    }
    return {
      registrationLinkId: token.replace("sess:", ""),
      typ: PATIENT_SESSION_TOKEN_TYPE,
    };
  }
}

describe("RegistrationService", () => {
  const rawRsaId = "9001010000080";
  const hashedRsaId = `hashed:${rawRsaId}`;
  const staffPractice1: VerifiedPracticeSession = { practiceId: "practice-1" };

  let registrationRequests: InMemoryRegistrationRequestRepository;
  let registrationLinks: InMemoryRegistrationLinkRepository;
  let patientIdentities: InMemoryPatientIdentityRepository;
  let patientRecords: InMemoryPatientRecordRepository;
  let practices: InMemoryPracticeRepository;
  let notifier: SpyNotifier;
  let tokenSigner: FakeRegistrationLinkTokenSigner;
  let encrypter: TestEncrypter;
  let sessionSigner: FakePatientSessionTokenSigner;
  let patientPractices: InMemoryPatientPracticeRepository;
  let registrationDocuments: InMemoryRegistrationDocumentRepository;
  let protectedPatientSession: ProtectedPatientSession;
  let service: RegistrationService;

  beforeEach(() => {
    registrationRequests = new InMemoryRegistrationRequestRepository();
    registrationLinks = new InMemoryRegistrationLinkRepository();
    patientIdentities = new InMemoryPatientIdentityRepository(
      new Set([hashedRsaId]),
    );
    patientRecords = new InMemoryPatientRecordRepository();
    practices = new InMemoryPracticeRepository();
    practices.practices.set("practice-1", Practice.create("practice-1", "GP"));
    patientPractices = new InMemoryPatientPracticeRepository();
    registrationDocuments = new InMemoryRegistrationDocumentRepository();
    notifier = new SpyNotifier();
    tokenSigner = new FakeRegistrationLinkTokenSigner();
    encrypter = new TestEncrypter();
    sessionSigner = new FakePatientSessionTokenSigner();
    protectedPatientSession = new ProtectedPatientSession(
      sessionSigner,
      registrationLinks,
    );
    service = new RegistrationService(
      registrationRequests,
      registrationLinks,
      patientIdentities,
      patientRecords,
      practices,
      patientPractices,
      registrationDocuments,
      notifier,
      new DeterministicHasher(),
      encrypter,
      tokenSigner,
      sessionSigner,
      new FakeRegistrationLinkFormatter(),
    );
  });

  it("initiates a registration request, creates a fresh link, and notifies the patient", async () => {
    const result = await service.initiateRegistration({
      patientIdentityId: rawRsaId,
      practiceSession: staffPractice1,
      initiatedByStaffId: "staff-1",
    });

    const request = await registrationRequests.findById(
      result.registrationRequestId,
    );
    const link = await registrationLinks.findById("link-1");

    expect(result).toEqual({
      registrationRequestId: "registration-1",
      registrationRequestStatus: "AWAITING_COMPLETION",
      practiceName: "GP",
    });
    expect(request?.patientIdentityId.toString()).toBe(hashedRsaId);
    expect(request?.practiceId).toBe("practice-1");
    expect(registrationLinks.revokedPatients).toEqual([hashedRsaId]);
    expect(link?.patient.toString()).toBe(hashedRsaId);
    expect(link?.createdByStaffId).toBe("staff-1");
    expect(tokenSigner.signed).toHaveLength(1);
    expect(tokenSigner.signed[0].registrationLinkId).toBe("link-1");
    expect(notifier.notifications).toEqual([
      {
        recipient: "patient@example.com",
        body: "Open https://patient-reg.test/registration/token:link-1 in your browser to continue registration (request registration-1).",
      },
    ]);
  });

  it("does not create a registration request when the patient identity is unknown", async () => {
    patientIdentities = new InMemoryPatientIdentityRepository();
    service = new RegistrationService(
      registrationRequests,
      registrationLinks,
      patientIdentities,
      patientRecords,
      practices,
      patientPractices,
      registrationDocuments,
      notifier,
      new DeterministicHasher(),
      encrypter,
      tokenSigner,
      sessionSigner,
      new FakeRegistrationLinkFormatter(),
    );

    await expect(
      service.initiateRegistration({
        patientIdentityId: rawRsaId,
        practiceSession: staffPractice1,
        initiatedByStaffId: "staff-1",
      }),
    ).rejects.toThrow("Registrant not found.");

    expect(registrationRequests.requests.size).toBe(0);
    expect(registrationLinks.links.size).toBe(0);
    expect(notifier.notifications).toHaveLength(0);
  });

  it("does not create a registration request when the practice does not exist", async () => {
    await expect(
      service.initiateRegistration({
        patientIdentityId: rawRsaId,
        practiceSession: { practiceId: "missing-practice" },
        initiatedByStaffId: "staff-1",
      }),
    ).rejects.toThrow("Practice not found.");

    expect(registrationRequests.requests.size).toBe(0);
    expect(registrationLinks.links.size).toBe(0);
    expect(notifier.notifications).toHaveLength(0);
  });

  it("approves a submitted registration request", async () => {
    const patientIdentityId = HashedRsaId.fromPersisted(hashedRsaId);
    const request = new RegistrationRequest(
      "registration-1",
      patientIdentityId,
      "practice-1",
      RegistrationStatus.awaitingCompletion(),
    );
    request.submit(patientIdentityId);
    registrationRequests.requests.set(request.id, request);

    await registrationDocuments.create(
      new DraftRegistrationDocument(
        request.id,
        patientIdentityId,
        EncryptedValue.fromPersisted("t:doc@example.com"),
        EncryptedValue.fromPersisted("t:0821111111"),
        EncryptedValue.fromPersisted("t:1 Test St"),
        EncryptedValue.fromPersisted("t:Document Person"),
      ),
    );

    const result = await service.approveRegistration({
      practiceSession: staffPractice1,
      registrationRequestId: request.id,
      approvedByStaffId: "staff-1",
    });

    expect(result).toEqual({
      registrationRequestId: request.id,
      registrationRequestStatus: "APPROVED",
      practiceName: "GP",
    });
    expect(registrationRequests.updates).toHaveLength(1);
    expect(registrationRequests.updates[0].id).toBe(request.id);
    expect(registrationRequests.updates[0].request.status?.toString()).toBe(
      "APPROVED",
    );
    expect(patientPractices.byPair.size).toBe(1);
    const [link] = patientPractices.byPair.values();
    expect(link.patientIdentityId.toString()).toBe(hashedRsaId);
    expect(link.practiceId).toBe("practice-1");

    const rec = await patientRecords.findByPatientIdentity(patientIdentityId);
    await expect(rec?.email?.decrypt(encrypter)).resolves.toBe(
      "doc@example.com",
    );
    await expect(rec?.phoneNumber?.decrypt(encrypter)).resolves.toBe(
      "0821111111",
    );
    await expect(rec?.residentialAddress?.decrypt(encrypter)).resolves.toBe(
      "1 Test St",
    );
    await expect(rec?.fullName?.decrypt(encrypter)).resolves.toBe(
      "Document Person",
    );
  });

  it("rejects approval when the request belongs to another practice", async () => {
    const patientIdentityId = HashedRsaId.fromPersisted(hashedRsaId);
    const request = new RegistrationRequest(
      "registration-x",
      patientIdentityId,
      "practice-1",
      RegistrationStatus.awaitingReview(),
    );
    registrationRequests.requests.set(request.id, request);
    await registrationDocuments.create(
      new DraftRegistrationDocument(
        request.id,
        patientIdentityId,
        EncryptedValue.fromPersisted("t:a@b.c"),
        EncryptedValue.fromPersisted("t:1"),
        EncryptedValue.fromPersisted("t:x"),
        EncryptedValue.fromPersisted("t:X"),
      ),
    );

    await expect(
      service.approveRegistration({
        practiceSession: { practiceId: "other-practice" },
        registrationRequestId: request.id,
        approvedByStaffId: "staff-1",
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("creates a practice with a trimmed name", async () => {
    const result = await service.createPractice({
      name: "  Example Practice  ",
    });

    expect(result).toEqual({
      id: "practice-2",
      name: "Example Practice",
    });
    expect(await practices.findById(result.id)).toEqual(
      Practice.create("practice-2", "Example Practice"),
    );
  });

  it("finds practices", async () => {
    await service.createPractice({ name: "Alpha Practice" });

    await expect(service.findPracticeById("practice-1")).resolves.toEqual({
      id: "practice-1",
      name: "GP",
    });
    await expect(service.findPractices()).resolves.toEqual([
      { id: "practice-1", name: "GP" },
      { id: "practice-2", name: "Alpha Practice" },
    ]);
  });

  it("lists registration requests for a practice, newest by id first", async () => {
    const pA = HashedRsaId.fromPersisted("hashed:patient-a");
    const pB = HashedRsaId.fromPersisted("hashed:patient-b");
    const pOther = HashedRsaId.fromPersisted("hashed:patient-c");
    const older = new RegistrationRequest(
      "00000000-0000-4000-8000-000000000001",
      pA,
      "practice-1",
      RegistrationStatus.awaitingReview(),
    );
    const newer = new RegistrationRequest(
      "00000000-0000-4000-8000-000000000002",
      pB,
      "practice-1",
      RegistrationStatus.rejected(),
      "Missing documents",
    );
    const otherPractice = new RegistrationRequest(
      "00000000-0000-4000-8000-000000000003",
      pOther,
      "practice-2",
      RegistrationStatus.awaitingCompletion(),
    );
    registrationRequests.requests.set(older.id, older);
    registrationRequests.requests.set(newer.id, newer);
    registrationRequests.requests.set(otherPractice.id, otherPractice);
    practices.practices.set(
      "practice-2",
      Practice.create("practice-2", "Other"),
    );

    const list = await service.findAllPracticeRegRequests(staffPractice1);

    expect(list).toHaveLength(2);
    expect(list[0].registrationRequestId).toBe(newer.id);
    expect(list[0].registrationRequestStatus).toBe("REJECTED");
    expect(list[0].rejectionReason).toBe("Missing documents");
    expect(list[0].practiceName).toBe("GP");
    expect(list[1].registrationRequestId).toBe(older.id);
    expect(list[1].registrationRequestStatus).toBe("AWAITING_REVIEW");
    expect(list[1].rejectionReason).toBeUndefined();
    expect(list[1].practiceName).toBe("GP");
    expect(list[0].patientName).toBeNull();
    expect(list[1].patientName).toBeNull();
  });

  it("throws when listing registration requests for an unknown practice", async () => {
    await expect(
      service.findAllPracticeRegRequests({ practiceId: "no-such-practice" }),
    ).rejects.toThrow("Practice not found.");
  });

  it("findRegistrationRequestsForPatientSession: throws on invalid session token", async () => {
    await expect(protectedPatientSession.verify("not-sess")).rejects.toThrow(
      "Invalid session token",
    );
  });

  it("findRegistrationRequestsForPatientSession: throws when link row is missing", async () => {
    await expect(
      protectedPatientSession.verify("sess:orphan-id"),
    ).rejects.toThrow("Invalid or stale session");
  });

  it("findRegistrationRequestsForPatientSession: returns requests for patient on link", async () => {
    placeRegistrationLink("lnk-patient-list");
    const patientSession = await protectedPatientSession.verify(
      "sess:lnk-patient-list",
    );
    const patient = HashedRsaId.fromPersisted(hashedRsaId);
    const r1 = new RegistrationRequest(
      "req-mr-1",
      patient,
      "practice-1",
      RegistrationStatus.awaitingCompletion(),
    );
    const r2 = new RegistrationRequest(
      "req-mr-2",
      patient,
      "practice-2",
      RegistrationStatus.rejected(),
      "bad",
    );
    registrationRequests.requests.set(r1.id, r1);
    registrationRequests.requests.set(r2.id, r2);
    practices.practices.set("practice-2", Practice.create("practice-2", "P2"));

    const list = await service.findAllPatientRegRequests(patientSession);
    expect(list).toHaveLength(2);
    expect(list).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          registrationRequestId: "req-mr-1",
          registrationRequestStatus: "AWAITING_COMPLETION",
          practiceName: "GP",
          patientName: null,
        }),
        expect.objectContaining({
          registrationRequestId: "req-mr-2",
          registrationRequestStatus: "REJECTED",
          rejectionReason: "bad",
          practiceName: "P2",
          patientName: null,
        }),
      ]),
    );
  });

  it("findPatientRegRequestById: returns one request with practice name", async () => {
    placeRegistrationLink("lnk-single");
    const patientSession =
      await protectedPatientSession.verify("sess:lnk-single");
    const patient = HashedRsaId.fromPersisted(hashedRsaId);
    const req = new RegistrationRequest(
      "req-single-1",
      patient,
      "practice-1",
      RegistrationStatus.awaitingCompletion(),
    );
    registrationRequests.requests.set(req.id, req);

    const item = await service.findPatientRegRequestById(
      patientSession,
      "req-single-1",
    );
    expect(item).toEqual({
      registrationRequestId: "req-single-1",
      registrationRequestStatus: "AWAITING_COMPLETION",
      practiceName: "GP",
      patientName: null,
    });
  });

  it("findPatientRegRequestById: throws when request is missing", async () => {
    placeRegistrationLink("lnk-miss");
    const patientSession =
      await protectedPatientSession.verify("sess:lnk-miss");
    await expect(
      service.findPatientRegRequestById(patientSession, "no-such-id"),
    ).rejects.toThrow("Registration request not found");
  });

  it("findPatientRegRequestById: throws when session does not match request patient", async () => {
    const otherPatient = HashedRsaId.fromPersisted("hashed:other-id");
    placeRegistrationLink("lnk-mismatch", { patient: otherPatient });
    const patientSession =
      await protectedPatientSession.verify("sess:lnk-mismatch");
    const req = new RegistrationRequest(
      "req-mismatch-1",
      HashedRsaId.fromPersisted(hashedRsaId),
      "practice-1",
      RegistrationStatus.awaitingCompletion(),
    );
    registrationRequests.requests.set(req.id, req);

    await expect(
      service.findPatientRegRequestById(patientSession, req.id),
    ).rejects.toThrow("Session is not valid for this registration request");
  });

  it("getPatientDetailsForSession: returns decrypted contact details", async () => {
    placeRegistrationLink("prof-link");
    const verifyResult = await service.verifyRegistration({
      registrationLinkId: "prof-link",
      rsaId: rawRsaId,
    });
    if (!verifyResult.success) {
      throw new Error("expected verify success");
    }
    const patientSession =
      await protectedPatientSession.verify("sess:prof-link");
    const details = await service.getPatientDetailsForSession(patientSession);
    expect(details).toEqual({
      email: "patient@example.com",
      phone: undefined,
      residentialAddress: undefined,
    });
  });

  it("getPatientDetailsForSession: throws when patient identity is missing", async () => {
    placeRegistrationLink("no-pi", {
      patient: HashedRsaId.fromPersisted("hashed:not-in-repo"),
    });
    const patientSession = await protectedPatientSession.verify("sess:no-pi");
    await expect(
      service.getPatientDetailsForSession(patientSession),
    ).rejects.toThrow("Patient not found");
  });

  function placeRegistrationLink(
    id: string,
    opts: {
      expired?: boolean;
      revoked?: boolean;
      attempts?: number;
      patient?: HashedRsaId;
    } = {},
  ): RegistrationLink {
    const patient = opts.patient ?? HashedRsaId.fromPersisted(hashedRsaId);
    const expiresAt = opts.expired
      ? new Date(Date.now() - 10_000)
      : new Date(Date.now() + 60_000);
    const status = opts.revoked
      ? RegistrationLinkStatus.revoked()
      : RegistrationLinkStatus.active();
    const link = new RegistrationLink(
      id,
      status,
      expiresAt,
      patient,
      "staff-1",
      opts.attempts ?? 0,
      MAX_ATTEMPTS,
    );
    registrationLinks.links.set(id, link);
    return link;
  }

  it("submits a registration document and sets status to AWAITING_REVIEW", async () => {
    placeRegistrationLink("doc-submit-1");
    const patientSession =
      await protectedPatientSession.verify("sess:doc-submit-1");
    const patient = HashedRsaId.fromPersisted(hashedRsaId);
    const req = new RegistrationRequest(
      "req-doc-1",
      patient,
      "practice-1",
      RegistrationStatus.awaitingCompletion(),
    );
    registrationRequests.requests.set(req.id, req);

    const out = await service.submitRegistrationDocument({
      patientSession,
      registrationRequestId: req.id,
      fullName: "Me Myself",
      email: "me@mail.test",
      phoneNumber: "0820000000",
      residentialAddress: "1 Example Rd",
    });

    expect(out).toEqual({
      registrationRequestId: "req-doc-1",
      registrationRequestStatus: "AWAITING_REVIEW",
      practiceName: "GP",
    });
    expect(req.getStatus().toString()).toBe("AWAITING_REVIEW");
    expect(registrationDocuments.byId.size).toBe(1);

    const list = await service.findAllPracticeRegRequests(staffPractice1);
    expect(list).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          registrationRequestId: "req-doc-1",
          patientName: "Me Myself",
        }),
      ]),
    );
  });

  it("rejects submission when the registration request is missing", async () => {
    placeRegistrationLink("doc-orphan");
    const patientSession =
      await protectedPatientSession.verify("sess:doc-orphan");
    await expect(
      service.submitRegistrationDocument({
        patientSession,
        registrationRequestId: "nonexistent",
        fullName: "A",
        email: "a@b.c",
        phoneNumber: "1",
        residentialAddress: "a",
      }),
    ).rejects.toThrow("Registration request not found");
  });

  it("updates the registration document when resubmitting after rejection", async () => {
    placeRegistrationLink("doc-resubmit");
    const resubmitSession =
      await protectedPatientSession.verify("sess:doc-resubmit");
    const patient = HashedRsaId.fromPersisted(hashedRsaId);
    const req = new RegistrationRequest(
      "req-doc-3",
      patient,
      "practice-1",
      RegistrationStatus.rejected(),
      "Incomplete",
    );
    registrationRequests.requests.set(req.id, req);
    registrationDocuments.byId.set(
      "doc-1",
      new RegistrationDocument(
        "doc-1",
        "req-doc-3",
        patient,
        EncryptedValue.fromPersisted("t:old@e.test"),
        EncryptedValue.fromPersisted("t:1"),
        EncryptedValue.fromPersisted("t:old"),
        EncryptedValue.fromPersisted("t:Old Name"),
        new Date(0),
      ),
    );

    await service.submitRegistrationDocument({
      patientSession: resubmitSession,
      registrationRequestId: "req-doc-3",
      fullName: "New Name",
      email: "new@e.test",
      phoneNumber: "082",
      residentialAddress: "2 New St",
    });

    const doc =
      (await registrationDocuments.findByRegistrationRequestId("req-doc-3"))!;
    await expect(doc.email.decrypt(encrypter)).resolves.toBe("new@e.test");
    const stored = await registrationRequests.findById("req-doc-3");
    expect(stored?.getStatus().toString()).toBe("AWAITING_REVIEW");
  });

  it("does not allow submission from AWAITING_REVIEW (already submitted)", async () => {
    placeRegistrationLink("doc-state");
    const patientSession =
      await protectedPatientSession.verify("sess:doc-state");
    const patient = HashedRsaId.fromPersisted(hashedRsaId);
    const req = new RegistrationRequest(
      "req-doc-4",
      patient,
      "practice-1",
      RegistrationStatus.awaitingReview(),
    );
    registrationRequests.requests.set(req.id, req);

    await expect(
      service.submitRegistrationDocument({
        patientSession,
        registrationRequestId: req.id,
        fullName: "A",
        email: "a@b.c",
        phoneNumber: "1",
        residentialAddress: "a",
      }),
    ).rejects.toThrow("Cannot submit registration in current state");
  });

  it("rejects document submission when session does not match the request patient", async () => {
    const otherPatient = HashedRsaId.fromPersisted("hashed:other-id");
    placeRegistrationLink("doc-wrong-patient", { patient: otherPatient });
    const req = new RegistrationRequest(
      "req-doc-sess-3",
      HashedRsaId.fromPersisted(hashedRsaId),
      "practice-1",
      RegistrationStatus.awaitingCompletion(),
    );
    registrationRequests.requests.set(req.id, req);
    const patientSession = await protectedPatientSession.verify(
      "sess:doc-wrong-patient",
    );

    await expect(
      service.submitRegistrationDocument({
        patientSession,
        registrationRequestId: req.id,
        fullName: "A",
        email: "a@b.c",
        phoneNumber: "1",
        residentialAddress: "a",
      }),
    ).rejects.toThrow("Session is not valid for this registration request");
  });

  it("verifyRegistration: fails when the registration link does not exist", async () => {
    const r = await service.verifyRegistration({
      registrationLinkId: "missing",
      rsaId: rawRsaId,
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.errorCode).toBe("REGISTRATION_LINK_NOT_FOUND");
      expect(r.maxAttempts).toBe(MAX_ATTEMPTS);
    }
  });

  it("verifyRegistration: fails for a revoked or expired link without recording attempts", async () => {
    placeRegistrationLink("rv", { revoked: true });
    const r0 = await service.verifyRegistration({
      registrationLinkId: "rv",
      rsaId: rawRsaId,
    });
    expect(r0).toMatchObject({ success: false, errorCode: "LINK_REVOKED" });

    placeRegistrationLink("ex", { expired: true });
    const r1 = await service.verifyRegistration({
      registrationLinkId: "ex",
      rsaId: rawRsaId,
    });
    expect(r1).toMatchObject({ success: false, errorCode: "EXPIRED" });
  });

  it("verifyRegistration: records a failed attempt on identity mismatch", async () => {
    placeRegistrationLink("m1", {
      patient: HashedRsaId.fromPersisted("hashed:someone-else"),
    });
    const r = await service.verifyRegistration({
      registrationLinkId: "m1",
      rsaId: rawRsaId,
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.errorCode).toBe("IDENTITY_MISMATCH");
      expect(r.attemptsAfterFailure).toBe(1);
    }
    const after = (await registrationLinks.findById("m1"))!;
    expect(after.getAttempts()).toBe(1);
  });

  it("verifyRegistration: returns ATTEMPTS_EXHAUSTED on the last failed try", async () => {
    placeRegistrationLink("m2", {
      attempts: MAX_ATTEMPTS - 1,
      patient: HashedRsaId.fromPersisted("hashed:other"),
    });
    const r = await service.verifyRegistration({
      registrationLinkId: "m2",
      rsaId: rawRsaId,
    });
    expect(r).toMatchObject({
      success: false,
      errorCode: "ATTEMPTS_EXHAUSTED",
    });
  });

  it("verifyRegistration: issues a session token and revokes the link on success", async () => {
    placeRegistrationLink("ok1");
    const r = await service.verifyRegistration({
      registrationLinkId: "ok1",
      rsaId: rawRsaId,
    });
    if (!r.success) {
      throw new Error("expected success");
    }
    expect(r.sessionToken).toBe("sess:ok1");
    expect(r.registrationLinkId).toBe("ok1");
    const link = (await registrationLinks.findById("ok1"))!;
    expect(link.getStatus().toString()).toBe("REVOKED");
    const pr = await patientRecords.findByPatientIdentity(
      HashedRsaId.fromPersisted(hashedRsaId),
    );
    await expect(pr?.email?.decrypt(encrypter)).resolves.toBe(
      "patient@example.com",
    );
  });

  it("verifyRegistration: allows success after two failed mismatches when the ID is then correct", async () => {
    const otherValidRsa = "8501010000049";
    placeRegistrationLink("ok2");
    await service.verifyRegistration({
      registrationLinkId: "ok2",
      rsaId: otherValidRsa,
    });
    await service.verifyRegistration({
      registrationLinkId: "ok2",
      rsaId: otherValidRsa,
    });
    const r = await service.verifyRegistration({
      registrationLinkId: "ok2",
      rsaId: rawRsaId,
    });
    expect(r.success).toBe(true);
  });

  it("verifyRegistrationByLinkToken: returns INVALID_LINK_TOKEN for a bad token", async () => {
    const r = await service.verifyRegistrationByLinkToken({
      token: "not-a-valid-token",
      rsaId: rawRsaId,
    });
    expect(r).toMatchObject({
      success: false,
      errorCode: "INVALID_LINK_TOKEN",
    });
  });

  it("verifyRegistrationByLinkToken: resolves the link from the token and succeeds", async () => {
    placeRegistrationLink("vbt1");
    const r = await service.verifyRegistrationByLinkToken({
      token: "token:vbt1",
      rsaId: rawRsaId,
    });
    if (!r.success) {
      throw new Error("expected success");
    }
    expect(r.sessionToken).toBe("sess:vbt1");
  });
});
