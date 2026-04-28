import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { FindOptionsRelations } from "typeorm";
import { Repository as TypeOrmRepository } from "typeorm";
import { ConsentRecordRepository as Port } from "~/modules/registration/domain/ports/consent-record.repository";
import {
  ConsentRecord,
  DraftConsentRecord,
} from "~/modules/registration/domain/entities/consent-record.entity";
import { ConsentRecordEntity } from "~/modules/registration/infrastructure/persistence/typeorm/entities/consent-record.entity";
import { HashedRsaId } from "~/modules/registration/domain/value-objects/hashed-rsaid";

@Injectable()
export class TypeOrmConsentRecordRepository extends Port {
  private static readonly relations: FindOptionsRelations<ConsentRecordEntity> =
    {
      registrationRequest: true,
      patientIdentity: true,
      consentTemplate: true,
    };

  constructor(
    @InjectRepository(ConsentRecordEntity)
    private readonly repo: TypeOrmRepository<ConsentRecordEntity>,
  ) {
    super();
  }

  async create(draft: DraftConsentRecord): Promise<ConsentRecord> {
    const saved = await this.repo.save({
      registrationRequest: { id: draft.registrationRequestId },
      patientIdentity: { identity: draft.patientIdentityId.toString() },
      consentTemplate: { id: draft.consentTemplateId },
      givenAt: new Date(),
    });
    const entity = await this.repo.findOneOrFail({
      where: { id: saved.id },
      relations: TypeOrmConsentRecordRepository.relations,
    });
    return this.toDomain(entity);
  }

  async findByRegistrationRequestId(
    registrationRequestId: string,
  ): Promise<ConsentRecord | null> {
    const entity = await this.repo.findOne({
      where: { registrationRequest: { id: registrationRequestId } },
      relations: TypeOrmConsentRecordRepository.relations,
    });
    return entity ? this.toDomain(entity) : null;
  }

  private toDomain(entity: ConsentRecordEntity): ConsentRecord {
    if (
      !entity.registrationRequest ||
      !entity.patientIdentity ||
      !entity.consentTemplate
    ) {
      throw new Error("ConsentRecord is missing required relations");
    }
    return new ConsentRecord(
      entity.id,
      entity.registrationRequest.id,
      HashedRsaId.fromPersisted(entity.patientIdentity.identity),
      entity.consentTemplate.id,
      entity.givenAt,
    );
  }
}
