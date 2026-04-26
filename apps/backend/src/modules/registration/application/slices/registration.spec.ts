import { Practice } from "../../domain/entities/practice.entity";
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
import { RegistrationLinkFormatter } from "../../domain/ports/registration-link.formatter";
import {
  RegistrationLinkTokenPayload,
  RegistrationLinkTokenSigner,
} from "../../domain/ports/registration-link-token.signer";
import { RegistrationLinkRepository } from "../../domain/ports/registration-link.repository";
import { RegistrationRequestRepository } from "../../domain/ports/registration-request.repository";
import { PatientIdentity } from "../../domain/entities/patient-identity.entity";
import { EncryptedValue } from "../../domain/value-objects/encrypted-value";
import { HashedRsaId } from "../../domain/value-objects/hashed-rsaid";
import { RegistrationLinkStatus } from "../../domain/value-objects/registration-link-status";
import { RegistrationStatus } from "../../domain/value-objects/registration-status";
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
    return { registrationLinkId: token.replace("token:", "") };
  }
}

class FakeRegistrationLinkFormatter extends RegistrationLinkFormatter {
  format(token: string): string {
    return `https://patient-reg.test/registration/${token}`;
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
  let service: RegistrationService;

  beforeEach(() => {
    registrationRequests = new InMemoryRegistrationRequestRepository();
    registrationLinks = new InMemoryRegistrationLinkRepository();
    patientIdentities = new InMemoryPatientIdentityRepository(
      new Set([hashedRsaId]),
    );
    practices = new InMemoryPracticeRepository();
    practices.practices.set("practice-1", Practice.create("practice-1", "GP"));
    notifier = new SpyNotifier();
    tokenSigner = new FakeRegistrationLinkTokenSigner();
    encrypter = new TestEncrypter();
    service = new RegistrationService(
      registrationRequests,
      registrationLinks,
      patientIdentities,
      practices,
      notifier,
      new DeterministicHasher(),
      encrypter,
      tokenSigner,
      new FakeRegistrationLinkFormatter(),
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
      notifier,
      new DeterministicHasher(),
      encrypter,
      tokenSigner,
      new FakeRegistrationLinkFormatter(),
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
});
