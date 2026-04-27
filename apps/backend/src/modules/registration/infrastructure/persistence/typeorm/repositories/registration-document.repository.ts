import { Injectable } from "@nestjs/common";
import { RegistrationDocumentRepository as Port } from "~/modules/registration/domain/ports/registration-document.repository";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository as TypeOrmRepository } from "typeorm";
import type { FindOptionsRelations } from "typeorm";
import {
  DraftRegistrationDocument,
  RegistrationDocument,
  UpdateRegistrationDocument,
} from "~/modules/registration/domain/entities/registration-document.entity";
import { HashedRsaId } from "~/modules/registration/domain/value-objects/hashed-rsaid";
import { EncryptedValue } from "~/modules/registration/domain/value-objects/encrypted-value";
import { RegistrationDocumentEntity } from "~/modules/registration/infrastructure/persistence/typeorm/entities/registration-document.entity";

@Injectable()
export class TypeOrmRegistrationDocumentRepository extends Port {
  private static readonly relations: FindOptionsRelations<RegistrationDocumentEntity> =
    {
      registrationRequest: true,
      patientIdentity: true,
    };

  constructor(
    @InjectRepository(RegistrationDocumentEntity)
    private readonly repo: TypeOrmRepository<RegistrationDocumentEntity>,
  ) {
    super();
  }

  async create(
    document: DraftRegistrationDocument,
  ): Promise<RegistrationDocument> {
    const submittedAt = new Date();
    const saved = await this.repo.save({
      registrationRequest: { id: document.registrationRequestId },
      patientIdentity: { identity: document.patientIdentityId.toString() },
      email: document.email.toPersisted(),
      phoneNumber: document.phoneNumber.toPersisted(),
      residentialAddress: document.residentialAddress.toPersisted(),
      fullName: document.fullName.toPersisted(),
      submittedAt,
    });
    return this.toDomain(
      (await this.repo.findOne({
        where: { id: saved.id },
        relations: TypeOrmRegistrationDocumentRepository.relations,
      }))!,
    );
  }

  async findByRegistrationRequestId(
    registrationRequestId: string,
  ): Promise<RegistrationDocument | null> {
    const entity = await this.repo.findOne({
      where: { registrationRequest: { id: registrationRequestId } },
      relations: TypeOrmRegistrationDocumentRepository.relations,
    });
    return entity ? this.toDomain(entity) : null;
  }

  async update(
    id: string,
    update: UpdateRegistrationDocument,
  ): Promise<RegistrationDocument> {
    await this.repo.update(
      { id },
      {
        email: update.email.toPersisted(),
        phoneNumber: update.phoneNumber.toPersisted(),
        residentialAddress: update.residentialAddress.toPersisted(),
        fullName: update.fullName.toPersisted(),
        submittedAt: update.submittedAt,
      },
    );
    const entity = await this.repo.findOne({
      where: { id },
      relations: TypeOrmRegistrationDocumentRepository.relations,
    });
    if (!entity) {
      throw new Error("Registration document not found after update");
    }
    return this.toDomain(entity);
  }

  private toDomain(entity: RegistrationDocumentEntity): RegistrationDocument {
    if (!entity.patientIdentity || !entity.registrationRequest) {
      throw new Error("Registration document is missing relations");
    }
    return new RegistrationDocument(
      entity.id,
      entity.registrationRequest.id,
      HashedRsaId.fromPersisted(entity.patientIdentity.identity),
      EncryptedValue.fromPersisted(entity.email),
      EncryptedValue.fromPersisted(entity.phoneNumber),
      EncryptedValue.fromPersisted(entity.residentialAddress),
      entity.fullName
        ? EncryptedValue.fromPersisted(entity.fullName)
        : undefined,
      entity.submittedAt,
    );
  }
}
