import { Practice } from "../../domain/entities/practice.entity";
import {
  type DraftRegistrationDocument,
  RegistrationDocument,
  UpdateRegistrationDocument,
} from "../../domain/entities/registration-document.entity";
import { ContactDetails } from "../../domain/value-objects/contact-details";
import {
  DraftPatientPractice,
  PatientPractice,
} from "../../domain/entities/patient-practice.entity";
import {
  DraftRegistrationRequest,
  RegistrationRequest,
  UpdateRegistrationRequest,
} from "../../domain/entities/registration-request.entity";
import {
  DraftRegistrationLink,
  RegistrationLink,
  UpdateRegistrationLink,
} from "../../domain/entities/registration-link.entity";
import { Encrypter } from "../../domain/ports/encrypter";
import { Hasher } from "../../domain/ports/hasher";
import { Notifier } from "../../domain/ports/notifier";
import { PatientIdentityRepository } from "../../domain/ports/patient-identity.repository";
import { PracticeRepository } from "../../domain/ports/practice.repository";
import { PatientPracticeRepository } from "../../domain/ports/patient-practice.repository";
import { RegistrationLinkFormatter } from "../../domain/ports/registration-link.formatter";
import {
  RegistrationLinkTokenPayload,
  RegistrationLinkTokenSigner,
} from "../../domain/ports/registration-link-token.signer";
import {
  type PatientSessionTokenPayload,
  PatientSessionTokenSigner,
  PATIENT_SESSION_TOKEN_TYPE,
} from "../../domain/ports/patient-session-token.signer";
import { MAX_ATTEMPTS } from "../../domain/constants/registration-link.constants";
import { RegistrationLinkRepository } from "../../domain/ports/registration-link.repository";
import { RegistrationRequestRepository } from "../../domain/ports/registration-request.repository";
import { RegistrationDocumentRepository } from "../../domain/ports/registration-document.repository";
import { PatientIdentity } from "../../domain/entities/patient-identity.entity";
import { EncryptedValue } from "../../domain/value-objects/encrypted-value";
import { HashedRsaId } from "../../domain/value-objects/hashed-rsaid";
import { RegistrationLinkStatus } from "../../domain/value-objects/registration-link-status";
import { RegistrationStatus } from "../../domain/value-objects/registration-status";
import { ProtectedPatientSession } from "../support/protected-patient-session";
import { RegistrationService } from "./registration";

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
    );
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
      document.contactDetails,
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
      update.contactDetails,
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

  let registrationRequests: InMemoryRegistrationRequestRepository;
  let registrationLinks: InMemoryRegistrationLinkRepository;
  let patientIdentities: InMemoryPatientIdentityRepository;
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
      practices,
      patientPractices,
      registrationDocuments,
      notifier,
      new DeterministicHasher(),
      encrypter,
      tokenSigner,
      sessionSigner,
      new FakeRegistrationLinkFormatter(),
      protectedPatientSession,
    );
  });

  it("initiates a registration request, creates a fresh link, and notifies the patient", async () => {
    const result = await service.initiateRegistration({
      patientIdentityId: rawRsaId,
      practiceId: "practice-1",
      initiatedByStaffId: "staff-1",
    });

    const request = await registrationRequests.findById(
      result.registrationRequestId,
    );
    const link = await registrationLinks.findById("link-1");

    expect(result).toEqual({
      registrationRequestId: "registration-1",
      registrationRequestStatus: "AWAITING_COMPLETION",
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
      practices,
      patientPractices,
      registrationDocuments,
      notifier,
      new DeterministicHasher(),
      encrypter,
      tokenSigner,
      sessionSigner,
      new FakeRegistrationLinkFormatter(),
      protectedPatientSession,
    );

    await expect(
      service.initiateRegistration({
        patientIdentityId: rawRsaId,
        practiceId: "practice-1",
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
        practiceId: "missing-practice",
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

    const result = await service.approveRegistration({
      registrationRequestId: request.id,
      approvedByStaffId: "staff-1",
    });

    expect(result).toEqual({
      registrationRequestId: request.id,
      registrationRequestStatus: "APPROVED",
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

    const list = await service.findAllPracticeRegRequests("practice-1");

    expect(list).toHaveLength(2);
    expect(list[0].registrationRequestId).toBe(newer.id);
    expect(list[0].registrationRequestStatus).toBe("REJECTED");
    expect(list[0].rejectionReason).toBe("Missing documents");
    expect(list[1].registrationRequestId).toBe(older.id);
    expect(list[1].registrationRequestStatus).toBe("AWAITING_REVIEW");
    expect(list[1].rejectionReason).toBeUndefined();
  });

  it("throws when listing registration requests for an unknown practice", async () => {
    await expect(
      service.findAllPracticeRegRequests("no-such-practice"),
    ).rejects.toThrow("Practice not found.");
  });

  it("findRegistrationRequestsForPatientSession: throws on invalid session token", async () => {
    await expect(service.findAllPatientRegRequests("not-sess")).rejects.toThrow(
      "Invalid session token",
    );
  });

  it("findRegistrationRequestsForPatientSession: throws when link row is missing", async () => {
    await expect(
      service.findAllPatientRegRequests("sess:orphan-id"),
    ).rejects.toThrow("Invalid or stale session");
  });

  it("findRegistrationRequestsForPatientSession: returns requests for patient on link", async () => {
    placeRegistrationLink("lnk-patient-list");
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

    const list = await service.findAllPatientRegRequests(
      "sess:lnk-patient-list",
    );
    expect(list).toHaveLength(2);
    expect(list).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          registrationRequestId: "req-mr-1",
          registrationRequestStatus: "AWAITING_COMPLETION",
        }),
        expect.objectContaining({
          registrationRequestId: "req-mr-2",
          registrationRequestStatus: "REJECTED",
          rejectionReason: "bad",
        }),
      ]),
    );
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
    const patientSession = await protectedPatientSession.verify(
      "sess:doc-submit-1",
    );
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
      email: "me@mail.test",
      phoneNumber: "0820000000",
      residentialAddress: "1 Example Rd",
    });

    expect(out).toEqual({
      registrationRequestId: "req-doc-1",
      registrationRequestStatus: "AWAITING_REVIEW",
    });
    expect(req.getStatus().toString()).toBe("AWAITING_REVIEW");
    expect(registrationDocuments.byId.size).toBe(1);
  });

  it("rejects submission when the registration request is missing", async () => {
    placeRegistrationLink("doc-orphan");
    const patientSession = await protectedPatientSession.verify(
      "sess:doc-orphan",
    );
    await expect(
      service.submitRegistrationDocument({
        patientSession,
        registrationRequestId: "nonexistent",
        email: "a@b.c",
        phoneNumber: "1",
        residentialAddress: "a",
      }),
    ).rejects.toThrow("Registration request not found");
  });

  it("updates the registration document when resubmitting after rejection", async () => {
    placeRegistrationLink("doc-resubmit");
    const resubmitSession = await protectedPatientSession.verify(
      "sess:doc-resubmit",
    );
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
        ContactDetails.create({
          email: "old@e.test",
          phoneNumber: "1",
          residentialAddress: "old",
        }),
        new Date(0),
      ),
    );

    await service.submitRegistrationDocument({
      patientSession: resubmitSession,
      registrationRequestId: "req-doc-3",
      email: "new@e.test",
      phoneNumber: "082",
      residentialAddress: "2 New St",
    });

    const doc =
      (await registrationDocuments.findByRegistrationRequestId("req-doc-3"))!;
    expect(doc.contactDetails.email).toBe("new@e.test");
    const stored = await registrationRequests.findById("req-doc-3");
    expect(stored?.getStatus().toString()).toBe("AWAITING_REVIEW");
  });

  it("does not allow submission from AWAITING_REVIEW (already submitted)", async () => {
    placeRegistrationLink("doc-state");
    const patientSession = await protectedPatientSession.verify("sess:doc-state");
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
