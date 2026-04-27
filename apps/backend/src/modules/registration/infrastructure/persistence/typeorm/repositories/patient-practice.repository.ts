import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import type { FindOptionsRelations } from "typeorm";
import { PatientPracticeRepository } from "~/modules/registration/domain/ports/patient-practice.repository";
import {
  DraftPatientPractice,
  PatientPractice,
} from "~/modules/registration/domain/entities/patient-practice.entity";
import { HashedRsaId } from "~/modules/registration/domain/value-objects/hashed-rsaid";
import { PatientPracticeEntity } from "~/modules/registration/infrastructure/persistence/typeorm/entities/patient-practice.entity";

@Injectable()
export class TypeOrmPatientPracticeRepository extends PatientPracticeRepository {
  private static readonly withPatientAndPractice: FindOptionsRelations<PatientPracticeEntity> =
    {
      patientIdentity: true,
      practice: true,
    };

  constructor(
    @InjectRepository(PatientPracticeEntity)
    private readonly repo: Repository<PatientPracticeEntity>,
  ) {
    super();
  }

  async ensureLinked(draft: DraftPatientPractice): Promise<PatientPractice> {
    const existing = await this.repo.findOne({
      where: {
        patientIdentity: { identity: draft.patientIdentityId.toString() },
        practice: { id: draft.practiceId },
      },
      relations: TypeOrmPatientPracticeRepository.withPatientAndPractice,
    });
    if (existing) {
      return TypeOrmPatientPracticeRepository.toDomain(existing);
    }

    const saved = await this.repo.save({
      patientIdentity: { identity: draft.patientIdentityId.toString() },
      practice: { id: draft.practiceId },
    });

    const entity = await this.repo.findOne({
      where: { id: saved.id },
      relations: TypeOrmPatientPracticeRepository.withPatientAndPractice,
    });
    if (!entity) {
      throw new Error("Patient–practice link not found after create");
    }
    return TypeOrmPatientPracticeRepository.toDomain(entity);
  }

  private static toDomain(entity: PatientPracticeEntity): PatientPractice {
    if (!entity.patientIdentity) {
      throw new Error(
        "Patient–practice link is missing patient identity relation",
      );
    }
    if (!entity.practice) {
      throw new Error("Patient–practice link is missing practice relation");
    }
    return new PatientPractice(
      entity.id,
      HashedRsaId.fromPersisted(entity.patientIdentity.identity),
      entity.practice.id,
      entity.createdAt,
    );
  }
}
