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
    const { contactDetails: cd, personalInformation: pi, medicalAidDetails: ma, medicalHistory: mh } = document;

    const saved = await this.repo.save({
      registrationRequest: { id: document.registrationRequestId },
      patientIdentity: { identity: document.patientIdentityId.toString() },
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
      submittedAt: new Date(),
    });
    return this.toDomain(
      await this.repo.findOneOrFail({
        where: { id: saved.id },
        relations: TypeOrmRegistrationDocumentRepository.relations,
      }),
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
    const { contactDetails: cd, personalInformation: pi, medicalAidDetails: ma, medicalHistory: mh } = update;

    await this.repo.update(
      { id },
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

    const e = entity;

    return new RegistrationDocument(
      e.id,
      e.registrationRequest.id,
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
      e.submittedAt,
    );
  }
}
