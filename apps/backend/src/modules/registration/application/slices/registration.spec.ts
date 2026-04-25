import {
  NewRegistrationRequest,
  RegistrationRequest,
} from "../../domain/entities/registration-request.entity";
import { Practice } from "../../domain/entities/practice.entity";
import { PatientIdentityRepository } from "../../domain/ports/patient-identity.repository";
import { PracticeRepository } from "../../domain/ports/practice.repository";
import { RegistrationRequestRepository } from "../../domain/ports/registration-request.repository";
import { HashedRsaId } from "../../domain/value-objects/hashed-rsaid";
import { RegistrationService } from "./registration";
import { ConsoleNotifier } from "../../infrastructure/transport/console-notifier";

class InMemoryRegistrationRequestRepository extends RegistrationRequestRepository {
  readonly requests = new Map<string, RegistrationRequest>();

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

  async create(request: NewRegistrationRequest): Promise<RegistrationRequest> {
    const created = RegistrationRequest.create({
      id: "registration-1",
      patientIdentityId: request.patientIdentityId,
      practiceId: request.practiceId,
    });
    this.requests.set(created.id, created);
    return created;
  }

  async update(
    id: RegistrationRequest["id"],
    request: Partial<RegistrationRequest>,
  ): Promise<void> {
    const existing = this.requests.get(id);
    if (!existing) {
      return;
    }
    this.requests.set(id, request as RegistrationRequest);
  }
}

class InMemoryPatientIdentityRepository extends PatientIdentityRepository {
  async exists(): Promise<boolean> {
    return true;
  }
}

class InMemoryPracticeRepository extends PracticeRepository {
  async create(name: Practice["name"]): Promise<Practice> {
    return Practice.create("practice-1", name);
  }

  async findById(id: Practice["id"]): Promise<Practice | null> {
    return id === "practice-1" ? Practice.create(id, "Practice One") : null;
  }

  async findAll(): Promise<Practice[]> {
    return [Practice.create("practice-1", "Practice One")];
  }
}

describe("RegistrationService", () => {
  let registrationRequests: InMemoryRegistrationRequestRepository;
  let service: RegistrationService;

  beforeEach(() => {
    registrationRequests = new InMemoryRegistrationRequestRepository();
    service = new RegistrationService(
      registrationRequests,
      new InMemoryPatientIdentityRepository(),
      new InMemoryPracticeRepository(),
      new ConsoleNotifier(), 
    );
  });

  it("initiates a registration request awaiting completion", async () => {
    const result = await service.initiateRegistration({
      patientIdentityId: HashedRsaId.fromPersisted("identity-1"),
      practiceId: "practice-1",
      initiatedByStaffId: "staff-1",
    });

    const request = await registrationRequests.findById(
      result.registrationRequestId,
    );

    expect(request).not.toBeNull();
    expect(request?.patientIdentityId.toString()).toBe("identity-1");
    expect(request?.practiceId).toBe("practice-1");
    expect(result.registrationRequestStatus).toBe("AWAITING_COMPLETION");
  });

  it("approves a submitted registration request", async () => {
    const patientIdentityId = HashedRsaId.fromPersisted("identity-1");
    const request = RegistrationRequest.create({
      id: "registration-1",
      patientIdentityId,
      practiceId: "practice-1",
    });
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
    expect(
      (await registrationRequests.findById(request.id))?.getStatus().toString(),
    ).toBe("APPROVED");
  });
});
