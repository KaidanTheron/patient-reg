import { Injectable } from "@nestjs/common";
import { PatientRecordRepository as Port } from "~/modules/registration/domain/ports/patient-record.repository";
import {
  DraftPatientRecord,
  PatientRecord,
  UpdatePatientRecord,
} from "~/modules/registration/domain/entities/patient-record.entity";
import {
  ContactDetails,
  EncryptedValue,
  Gender,
  HashedRsaId,
  IsoDate,
  MedicalAidDetails,
  MedicalAidScheme,
  MedicalHistory,
  PersonalInformation,
} from "~/modules/registration/domain/value-objects";
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
      email: draft.contactDetails.email?.toPersisted() ?? null,
      phoneNumber: draft.contactDetails.phone?.toPersisted() ?? null,
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

    const { contactDetails: cd, personalInformation: pi, medicalAidDetails: ma, medicalHistory: mh } = update;

    await this.repo.update(
      { id: entity.id },
      {
        email: cd.email?.toPersisted() ?? null,
        phoneNumber: cd.phone?.toPersisted() ?? null,
        altphone: cd.altphone?.toPersisted() ?? null,
        residentialAddress: cd.address?.toPersisted() ?? null,
        firstname: pi.firstname?.toPersisted() ?? null,
        lastname: pi.lastname?.toPersisted() ?? null,
        dateOfBirth: pi.dateOfBirth?.toPersisted() ?? null,
        gender: pi.gender?.toString() ?? null,
        scheme: ma.scheme?.toString() ?? null,
        memberNumber: ma.memberNumber?.toPersisted() ?? null,
        mainMember: ma.mainMember?.toPersisted() ?? null,
        mainMemberId: ma.mainMemberId?.toPersisted() ?? null,
        dependantCode: ma.dependantCode?.toPersisted() ?? null,
        allergies: mh.allergies?.toPersisted() ?? null,
        currentMedication: mh.currentMedication?.toPersisted() ?? null,
        chronicConditions: mh.chronicConditions?.toPersisted() ?? null,
        previousSurgeries: mh.previousSurgeries?.toPersisted() ?? null,
        familyHistory: mh.familyHistory?.toPersisted() ?? null,
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

    const e = entity;

    return new PatientRecord(
      e.id,
      HashedRsaId.fromPersisted(e.patientIdentity.identity),
      ContactDetails.create({
        email: e.email ? EncryptedValue.fromPersisted(e.email) : undefined,
        phone: e.phoneNumber ? EncryptedValue.fromPersisted(e.phoneNumber) : undefined,
        altphone: e.altphone ? EncryptedValue.fromPersisted(e.altphone) : undefined,
        address: e.residentialAddress ? EncryptedValue.fromPersisted(e.residentialAddress) : undefined,
      }),
      PersonalInformation.create({
        firstname: e.firstname ? EncryptedValue.fromPersisted(e.firstname) : undefined,
        lastname: e.lastname ? EncryptedValue.fromPersisted(e.lastname) : undefined,
        dateOfBirth: e.dateOfBirth
          ? EncryptedValue.fromPersisted(e.dateOfBirth, IsoDate.fromSerialized)
          : undefined,
        gender: e.gender ? Gender.fromPersisted(e.gender) : undefined,
      }),
      MedicalAidDetails.create({
        scheme: e.scheme ? MedicalAidScheme.fromPersisted(e.scheme) : undefined,
        memberNumber: e.memberNumber ? EncryptedValue.fromPersisted(e.memberNumber) : undefined,
        mainMember: e.mainMember ? EncryptedValue.fromPersisted(e.mainMember) : undefined,
        mainMemberId: e.mainMemberId ? EncryptedValue.fromPersisted(e.mainMemberId) : undefined,
        dependantCode: e.dependantCode ? EncryptedValue.fromPersisted(e.dependantCode) : undefined,
      }),
      MedicalHistory.create({
        allergies: e.allergies ? EncryptedValue.fromPersisted(e.allergies) : undefined,
        currentMedication: e.currentMedication ? EncryptedValue.fromPersisted(e.currentMedication) : undefined,
        chronicConditions: e.chronicConditions ? EncryptedValue.fromPersisted(e.chronicConditions) : undefined,
        previousSurgeries: e.previousSurgeries ? EncryptedValue.fromPersisted(e.previousSurgeries) : undefined,
        familyHistory: e.familyHistory ? EncryptedValue.fromPersisted(e.familyHistory) : undefined,
      }),
      e.updatedAt,
    );
  }
}
