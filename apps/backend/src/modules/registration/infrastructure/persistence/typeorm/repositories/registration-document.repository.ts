import { Injectable } from "@nestjs/common";
import { RegistrationDocumentRepository as Port } from "../../../../domain/ports/registration-document.repository";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository as TypeOrmRepository } from "typeorm";
import type { FindOptionsRelations } from "typeorm";
import {
  DraftRegistrationDocument,
  RegistrationDocument,
  UpdateRegistrationDocument,
} from "../../../../domain/entities/registration-document.entity";
import { HashedRsaId } from "../../../../domain/value-objects/hashed-rsaid";
import { ContactDetails } from "../../../../domain/value-objects/contact-details";
import { EncryptedValue } from "../../../../domain/value-objects/encrypted-value";
import { Encrypter } from "../../../../domain/ports/encrypter";
import { RegistrationDocumentEntity } from "../entities/registration-document.entity";

@Injectable()
export class TypeOrmRegistrationDocumentRepository extends Port {
  private static readonly relations: FindOptionsRelations<RegistrationDocumentEntity> = {
    registrationRequest: true,
    patientIdentity: true,
  };

  constructor(
    @InjectRepository(RegistrationDocumentEntity)
    private readonly repo: TypeOrmRepository<RegistrationDocumentEntity>,
    private readonly encrypter: Encrypter,
  ) {
    super();
  }

  async create(
    document: DraftRegistrationDocument,
  ): Promise<RegistrationDocument> {
    const [email, phone, address] = await Promise.all([
      EncryptedValue.create(
        document.contactDetails.email,
        this.encrypter,
      ),
      EncryptedValue.create(
        document.contactDetails.phoneNumber,
        this.encrypter,
      ),
      EncryptedValue.create(
        document.contactDetails.residentialAddress,
        this.encrypter,
      ),
    ]);
    const submittedAt = new Date();
    const saved = await this.repo.save({
      registrationRequest: { id: document.registrationRequestId },
      patientIdentity: { identity: document.patientIdentityId.toString() },
      email: email.toPersisted(),
      phoneNumber: phone.toPersisted(),
      residentialAddress: address.toPersisted(),
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
    const [email, phone, address] = await Promise.all([
      EncryptedValue.create(
        update.contactDetails.email,
        this.encrypter,
      ),
      EncryptedValue.create(
        update.contactDetails.phoneNumber,
        this.encrypter,
      ),
      EncryptedValue.create(
        update.contactDetails.residentialAddress,
        this.encrypter,
      ),
    ]);
    await this.repo.update(
      { id },
      {
        email: email.toPersisted(),
        phoneNumber: phone.toPersisted(),
        residentialAddress: address.toPersisted(),
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

  private async toDomain(
    entity: RegistrationDocumentEntity,
  ): Promise<RegistrationDocument> {
    if (!entity.patientIdentity || !entity.registrationRequest) {
      throw new Error("Registration document is missing relations");
    }
    const [em, ph, addr] = await Promise.all([
      EncryptedValue.fromPersisted(entity.email).decrypt(this.encrypter),
      EncryptedValue.fromPersisted(entity.phoneNumber).decrypt(this.encrypter),
      EncryptedValue.fromPersisted(
        entity.residentialAddress,
      ).decrypt(this.encrypter),
    ]);
    return new RegistrationDocument(
      entity.id,
      entity.registrationRequest.id,
      HashedRsaId.fromPersisted(entity.patientIdentity.identity),
      ContactDetails.fromPlain({
        email: em,
        phoneNumber: ph,
        residentialAddress: addr,
      }),
      entity.submittedAt,
    );
  }
}
