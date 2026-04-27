import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository as TypeOrmRepository } from "typeorm";
import type { FindOptionsRelations } from "typeorm";
import { RegistrationLinkRepository as Repository } from "~/modules/registration/domain/ports/registration-link.repository";
import {
  DraftRegistrationLink,
  RegistrationLink,
  UpdateRegistrationLink,
} from "~/modules/registration/domain/entities/registration-link.entity";
import { HashedRsaId } from "~/modules/registration/domain/value-objects/hashed-rsaid";
import { RegistrationLinkStatus } from "~/modules/registration/domain/value-objects/registration-link-status";
import { RegistrationLinkEntity } from "~/modules/registration/infrastructure/persistence/typeorm/entities/registration-link.entity";

@Injectable()
export class TypeOrmRegistrationLinkRepository extends Repository {
  private static readonly withPatientIdentity: FindOptionsRelations<RegistrationLinkEntity> =
    {
      patientIdentity: true,
    };

  constructor(
    @InjectRepository(RegistrationLinkEntity)
    private readonly repo: TypeOrmRepository<RegistrationLinkEntity>,
  ) {
    super();
  }

  async create(draft: DraftRegistrationLink): Promise<RegistrationLink> {
    const saved = await this.repo.save({
      patientIdentity: { identity: draft.patient.toString() },
      status: "ACTIVE",
      createdByStaffId: draft.createdByStaffId,
      expiresAt: draft.expiresAt,
      attempts: 0,
      maxAttempts: draft.maxAttempts,
    });
    const entity = await this.repo.findOne({
      where: { id: saved.id },
      relations: TypeOrmRegistrationLinkRepository.withPatientIdentity,
    });
    if (!entity) {
      throw new Error("Registration link not found after create");
    }
    return this.toDomain(entity);
  }

  async findById(id: RegistrationLink["id"]): Promise<RegistrationLink | null> {
    const entity = await this.repo.findOne({
      where: { id },
      relations: TypeOrmRegistrationLinkRepository.withPatientIdentity,
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findActiveByPatient(
    patient: RegistrationLink["patient"],
  ): Promise<RegistrationLink | null> {
    const entity = await this.repo.findOne({
      where: {
        patientIdentity: { identity: patient.toString() },
        status: "ACTIVE",
      },
      relations: TypeOrmRegistrationLinkRepository.withPatientIdentity,
    });
    return entity ? this.toDomain(entity) : null;
  }

  async revokeActiveForPatient(
    patient: RegistrationLink["patient"],
  ): Promise<void> {
    await this.repo.update(
      {
        patientIdentity: { identity: patient.toString() },
        status: "ACTIVE",
      },
      { status: "REVOKED" },
    );
  }

  async update(
    id: RegistrationLink["id"],
    link: UpdateRegistrationLink,
  ): Promise<void> {
    await this.repo.update(
      { id },
      {
        status: link.getStatus().toString(),
        attempts: link.getAttempts(),
      },
    );
  }

  private toDomain(entity: RegistrationLinkEntity): RegistrationLink {
    if (!entity.patientIdentity) {
      throw new Error("Registration link is missing patient identity relation");
    }
    return new RegistrationLink(
      entity.id,
      RegistrationLinkStatus.fromPersisted(entity.status),
      entity.expiresAt,
      HashedRsaId.fromPersisted(entity.patientIdentity.identity),
      entity.createdByStaffId,
      entity.attempts,
      entity.maxAttempts,
    );
  }
}
