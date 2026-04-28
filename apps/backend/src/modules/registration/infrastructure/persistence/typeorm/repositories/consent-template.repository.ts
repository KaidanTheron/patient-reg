import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository as TypeOrmRepository } from "typeorm";
import { ConsentTemplateRepository as Port } from "~/modules/registration/domain/ports/consent-template.repository";
import {
  ConsentTemplate,
  ConsentType,
  DraftConsentTemplate,
} from "~/modules/registration/domain/entities/consent-template.entity";
import { ConsentTemplateEntity } from "~/modules/registration/infrastructure/persistence/typeorm/entities/consent-template.entity";

@Injectable()
export class TypeOrmConsentTemplateRepository extends Port {
  constructor(
    @InjectRepository(ConsentTemplateEntity)
    private readonly repo: TypeOrmRepository<ConsentTemplateEntity>,
  ) {
    super();
  }

  async findActiveByPracticeAndType(
    practiceId: string,
    consentType: ConsentType,
  ): Promise<ConsentTemplate | null> {
    const entity = await this.repo.findOne({
      where: { practice: { id: practiceId }, consentType, isActive: true },
      relations: { practice: true },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async create(template: DraftConsentTemplate): Promise<ConsentTemplate> {
    const saved = await this.repo.save({
      practice: { id: template.practiceId },
      consentType: template.consentType,
      version: template.version,
      text: template.text,
      isActive: template.isActive,
    });
    const entity = await this.repo.findOneOrFail({
      where: { id: saved.id },
      relations: { practice: true },
    });
    return this.toDomain(entity);
  }

  private toDomain(entity: ConsentTemplateEntity): ConsentTemplate {
    if (!entity.practice) {
      throw new Error("ConsentTemplate is missing practice relation");
    }
    return new ConsentTemplate(
      entity.id,
      entity.practice.id,
      entity.consentType as ConsentType,
      entity.version,
      entity.text,
      entity.isActive,
      entity.createdAt,
    );
  }
}
