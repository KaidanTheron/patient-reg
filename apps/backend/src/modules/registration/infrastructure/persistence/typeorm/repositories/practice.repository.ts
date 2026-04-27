import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Practice as DomainPractice } from "~/modules/registration/domain/entities/practice.entity";
import { PracticeRepository as Repository } from "~/modules/registration/domain/ports/practice.repository";
import { Repository as TypeOrmRepository } from "typeorm";
import { PracticeEntity } from "~/modules/registration/infrastructure/persistence/typeorm/entities/practice.entity";

@Injectable()
export class PracticeRepository extends Repository {
  constructor(
    @InjectRepository(PracticeEntity)
    private readonly repo: TypeOrmRepository<PracticeEntity>,
  ) {
    super();
  }

  async create(name: DomainPractice["name"]): Promise<DomainPractice> {
    const created = await this.repo.save({ name });
    return this.toDomain(created);
  }

  async findById(id: DomainPractice["id"]): Promise<DomainPractice | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(): Promise<DomainPractice[]> {
    const entities = await this.repo.find({ order: { name: "ASC" } });
    return entities.map((entity) => this.toDomain(entity));
  }

  private toDomain(entity: PracticeEntity): DomainPractice {
    return DomainPractice.create(entity.id, entity.name);
  }
}
