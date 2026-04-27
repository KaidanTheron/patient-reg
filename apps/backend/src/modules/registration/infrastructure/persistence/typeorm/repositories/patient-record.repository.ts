import { Injectable } from "@nestjs/common";
import { PatientRecordRepository as Port } from "~/modules/registration/domain/ports/patient-record.repository";
import {
  DraftPatientRecord,
  PatientRecord,
  UpdatePatientRecord,
} from "~/modules/registration/domain/entities/patient-record.entity";
import { HashedRsaId } from "~/modules/registration/domain/value-objects/hashed-rsaid";
import { EncryptedValue } from "~/modules/registration/domain/value-objects/encrypted-value";
import { IsoDate } from "~/modules/registration/domain/value-objects/iso-date";
import { Encrypter } from "~/modules/registration/domain/ports/encrypter";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository as TypeOrmRepository } from "typeorm";
import { PatientRecordEntity } from "~/modules/registration/infrastructure/persistence/typeorm/entities/patient-record.entity";

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
    const { email, identity, phone, fullName, dateOfBirth } = {
      identity: draft.patientIdentityId.toString(),
      email: draft.email?.toPersisted(),
      phone: draft.phoneNumber?.toPersisted(),
      fullName: draft.fullName?.toPersisted(),
      dateOfBirth: draft.dateOfBirth?.toPersisted(),
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
      fullName: fullName ?? null,
      dateOfBirth: dateOfBirth ?? null,
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

    const payload = {
      email: update.email?.toPersisted() ?? null,
      phoneNumber: update.phoneNumber?.toPersisted() ?? null,
      residentialAddress: update.residentialAddress?.toPersisted() ?? null,
      fullName: update.fullName?.toPersisted() ?? null,
      dateOfBirth: update.dateOfBirth?.toPersisted() ?? null,
    };

    await this.repo.update({ id: entity.id }, payload);

    const reloaded = await this.repo.findOneOrFail({
      where: { id: entity.id },
      relations: { patientIdentity: true },
    });
    return this.toDomain(reloaded);
  }

  async updateFullName(
    patientIdentityId: HashedRsaId,
    fullName: string,
  ): Promise<void> {
    const entity = await this.repo.findOne({
      where: { patientIdentity: { identity: patientIdentityId.toString() } },
    });
    if (!entity) {
      return;
    }
    const encrypted = await EncryptedValue.create(fullName, this.encrypter);
    await this.repo.update(
      { id: entity.id },
      { fullName: encrypted.toPersisted() },
    );
  }

  private toDomain(entity: PatientRecordEntity): PatientRecord {
    if (!entity.patientIdentity) {
      throw new Error("Patient record is missing patient identity relation");
    }

    const {
      id,
      email,
      patientIdentity,
      phoneNumber,
      residentialAddress,
      fullName,
      dateOfBirth,
      updatedAt,
    } = entity;

    return new PatientRecord(
      id,
      HashedRsaId.fromPersisted(patientIdentity.identity),
      email ? EncryptedValue.fromPersisted(email) : undefined,
      phoneNumber ? EncryptedValue.fromPersisted(phoneNumber) : undefined,
      residentialAddress
        ? EncryptedValue.fromPersisted(residentialAddress)
        : undefined,
      fullName ? EncryptedValue.fromPersisted(fullName) : undefined,
      dateOfBirth
        ? EncryptedValue.fromPersisted(dateOfBirth, IsoDate.fromSerialized)
        : undefined,
      updatedAt,
    );
  }
}
