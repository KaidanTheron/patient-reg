import { Injectable } from "@nestjs/common";
import { PatientRecordRepository as Port } from "~/modules/registration/domain/ports/patient-record.repository";
import {
  DraftPatientRecord,
  PatientRecord,
  UpdatePatientRecord,
} from "~/modules/registration/domain/entities/patient-record.entity";
import { HashedRsaId } from "~/modules/registration/domain/value-objects";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository as TypeOrmRepository } from "typeorm";
import { PatientRecordEntity } from "~/modules/registration/infrastructure/persistence/typeorm/entities/patient-record.entity";

@Injectable()
export class TypeOrmPatientRecordRepository extends Port {
  constructor(
    @InjectRepository(PatientRecordEntity)
    private readonly repo: TypeOrmRepository<PatientRecordEntity>,
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
    const identity = draft.patientIdentityId.toString();

    const existing = await this.repo.findOne({
      where: { patientIdentity: { identity } },
      relations: { patientIdentity: true },
    });
    if (existing) {
      return this.toDomain(existing);
    }

    const saved = await this.repo.save({
      patientIdentity: { identity },
      email: draft.contactDetails.email?.toPersisted(),
      phoneNumber: draft.contactDetails.phone?.toPersisted(),
      firstname: draft.personalInformation.firstname?.toPersisted(),
      lastname: draft.personalInformation.lastname?.toPersisted(),
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

    const { contactDetails: cd, personalInformation: pi, medicalAidDetails: ma, medicalHistory: mh } =
      update.toPersisted();

    await this.repo.update(
      { id: entity.id },
      {
        email: cd.email,
        phoneNumber: cd.phone,
        altphone: cd.altphone,
        residentialAddress: cd.address,
        ...pi,
        ...ma,
        ...mh,
      },
    );

    const reloaded = await this.repo.findOneOrFail({
      where: { id: entity.id },
      relations: { patientIdentity: true },
    });
    return this.toDomain(reloaded);
  }

  private toDomain(entity: PatientRecordEntity): PatientRecord {
    if (!entity.patientIdentity) {
      throw new Error("Patient record is missing patient identity relation");
    }
    return PatientRecord.fromPersisted({
      ...entity,
      patientIdentityId: entity.patientIdentity.identity,
    });
  }
}
