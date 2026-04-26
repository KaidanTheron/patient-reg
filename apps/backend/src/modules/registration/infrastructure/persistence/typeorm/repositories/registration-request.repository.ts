import { Injectable } from "@nestjs/common";
import { RegistrationRequestRepository as Repository } from "../../../../domain/ports/registration-request.repository";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository as TypeOrmRepository } from "typeorm";
import type { FindOptionsRelations } from "typeorm";
import {
  RegistrationRequestEntity,
} from "../entities/registration-request.entity";
import {
    DraftRegistrationRequest,
  RegistrationRequest,
  UpdateRegistrationRequest,
} from "src/modules/registration/domain/entities/registration-request.entity";
import { RegistrationStatus } from "src/modules/registration/domain/value-objects/registration-status";
import { HashedRsaId } from "src/modules/registration/domain/value-objects/hashed-rsaid";

@Injectable()
export class RegistrationRequestRepository extends Repository {
  private static readonly withPatientAndPractice: FindOptionsRelations<RegistrationRequestEntity> = {
    patientIdentity: true,
    practice: true,
  };

  constructor(
    @InjectRepository(RegistrationRequestEntity)
    private readonly repo: TypeOrmRepository<RegistrationRequestEntity>,
  ) {
    super();
  }

  public async create(
    request: DraftRegistrationRequest,
  ): Promise<RegistrationRequest> {
    const saved = await this.repo.save({
      patientIdentity: { identity: request.patientIdentityId.toString() },
      status: request.status.toString() as RegistrationRequestEntity["status"],
      practice: { id: request.practiceId },
    });
    const entity = await this.repo.findOne({
      where: { id: saved.id },
      relations: RegistrationRequestRepository.withPatientAndPractice,
    });
    if (!entity) {
      throw new Error("Registration request not found after create");
    }
    return this.toDomain(entity);
  }

  public async findById(
    id: RegistrationRequest["id"],
  ): Promise<RegistrationRequest | null> {
    const entity = await this.repo.findOne({
      where: { id },
      relations: RegistrationRequestRepository.withPatientAndPractice,
    });
    return entity ? this.toDomain(entity) : null;
  }

  public async findByPatientAndPractice(
    patient: RegistrationRequest["patientIdentityId"],
    practice: RegistrationRequest["practiceId"],
  ): Promise<RegistrationRequest | null> {
    const entity = await this.repo.findOne({
      where: {
        patientIdentity: { identity: patient.toString() },
        practice: { id: practice },
      },
      relations: RegistrationRequestRepository.withPatientAndPractice,
    });
    return entity ? this.toDomain(entity) : null;
  }

  public async findAllByPracticeId(
    practiceId: RegistrationRequest["practiceId"],
  ): Promise<RegistrationRequest[]> {
    const entities = await this.repo.find({
      where: { practice: { id: practiceId } },
      relations: RegistrationRequestRepository.withPatientAndPractice,
      order: { createdAt: "DESC" },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  public async update(
    id: RegistrationRequest["id"],
    request: Partial<UpdateRegistrationRequest>,
  ): Promise<void> {
    const payload: Partial<RegistrationRequestEntity> = {
      status: request.status?.toString(),
      rejectionReason: request.rejectionReason,
    };

    await this.repo.update({ id }, payload);
  }

  private toDomain(entity: RegistrationRequestEntity): RegistrationRequest {
    if (!entity.patientIdentity) {
      throw new Error("Registration request is missing patient identity relation");
    }
    if (!entity.practice) {
      throw new Error("Registration request is missing practice relation");
    }
    return new RegistrationRequest(
      entity.id,
      HashedRsaId.fromPersisted(entity.patientIdentity.identity),
      entity.practice.id,
      new RegistrationStatus(entity.status),
      entity.rejectionReason ?? undefined,
    );
  }
}
