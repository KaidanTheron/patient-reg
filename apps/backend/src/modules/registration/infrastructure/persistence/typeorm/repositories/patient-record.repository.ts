import { Injectable } from "@nestjs/common";
import { PatientRecordRepository as Port } from "../../../../domain/ports/patient-record.repository";
import {
  DraftPatientRecord,
  PatientRecord,
  UpdatePatientRecord,
} from "../../../../domain/entities/patient-record.entity";
import { HashedRsaId } from "../../../../domain/value-objects/hashed-rsaid";
import { EncryptedValue } from "../../../../domain/value-objects/encrypted-value";
import { Encrypter } from "../../../../domain/ports/encrypter";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository as TypeOrmRepository } from "typeorm";
import { PatientRecordEntity } from "../entities/patient-record.entity";

@Injectable()
export class TypeOrmPatientRecordRepository extends Port {
  constructor(
    @InjectRepository(PatientRecordEntity)
    private readonly repo: TypeOrmRepository<PatientRecordEntity>,
    private readonly encrypter: Encrypter,
  ) {
    super();
  }

  async findByPatientIdentity(
    patientIdentityId: HashedRsaId,
  ): Promise<PatientRecord | null> {
    const entity = await this.repo.findOne({
      where: { patientIdentity: { identity: patientIdentityId.toString() } },
      relations: { patientIdentity: true },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async ensureFromIdentity(draft: DraftPatientRecord): Promise<PatientRecord> {
    const {
      email,
      identity,
      phone,
    } = {
      identity: draft.patientIdentityId.toString(),
      email: draft.email?.toPersisted(),
      phone: draft.phoneNumber?.toPersisted(),
    };

    const existing = await this.repo.findOne({
      where: { patientIdentity: { identity } },
      relations: { patientIdentity: true },
    });
    if (existing) {
      return this.toDomain(existing);
    }

    const saved = await this.repo.save({
      patientIdentity: { identity },
      email: email ?? null,
      phoneNumber: phone ?? null,
      residentialAddress: null,
    });

    const loaded = await this.repo.findOneOrFail({
      where: { id: saved.id },
      relations: { patientIdentity: true },
    });
    return this.toDomain(loaded);
  }

  async update(
    patientIdentityId: HashedRsaId,
    update: UpdatePatientRecord,
  ): Promise<PatientRecord> {
    const entity = await this.repo.findOne({
      where: { patientIdentity: { identity: patientIdentityId.toString() } },
      relations: { patientIdentity: true },
    });
    if (!entity) {
      throw new Error("Patient record not found");
    }

    const { email, phoneNumber, residentialAddress } = update.contact;
    const [e, p, a] = await Promise.all([
      EncryptedValue.create(email, this.encrypter),
      EncryptedValue.create(phoneNumber, this.encrypter),
      EncryptedValue.create(residentialAddress, this.encrypter),
    ]);

    await this.repo.update(
      { id: entity.id },
      {
        email: e.toPersisted(),
        phoneNumber: p.toPersisted(),
        residentialAddress: a.toPersisted(),
      },
    );
    const reloaded = await this.repo.findOneOrFail({
      where: { id: entity.id },
      relations: { patientIdentity: true },
    });
    return this.toDomain(reloaded);
  }

  private async toDomain(entity: PatientRecordEntity): Promise<PatientRecord> {
    if (!entity.patientIdentity) {
      throw new Error("Patient record is missing patient identity relation");
    }

    const {
      id,
      email,
      patientIdentity,
      phoneNumber,
      residentialAddress,
      updatedAt,
    } = entity;

    return new PatientRecord(
      id,
      HashedRsaId.fromPersisted(patientIdentity.identity),
      email ? EncryptedValue.fromPersisted(email) : undefined,
      phoneNumber ? EncryptedValue.fromPersisted(phoneNumber) : undefined,
      residentialAddress ? EncryptedValue.fromPersisted(residentialAddress): undefined,
      updatedAt,
    );
  }
}
