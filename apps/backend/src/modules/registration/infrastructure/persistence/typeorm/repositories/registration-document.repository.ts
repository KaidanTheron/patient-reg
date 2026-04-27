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
    const { contactDetails: cd, personalInformation: pi, medicalAidDetails: ma, medicalHistory: mh } =
      document.toPersisted();

    const saved = await this.repo.save({
      registrationRequest: { id: document.registrationRequestId },
      patientIdentity: { identity: document.patientIdentityId.toString() },
      email: cd.email,
      phoneNumber: cd.phone,
      altphone: cd.altphone,
      residentialAddress: cd.address,
      firstname: pi.firstname,
      lastname: pi.lastname,
      dateOfBirth: pi.dateOfBirth,
      gender: pi.gender,
      scheme: ma.scheme,
      memberNumber: ma.memberNumber,
      mainMember: ma.mainMember,
      mainMemberId: ma.mainMemberId,
      dependantCode: ma.dependantCode,
      allergies: mh.allergies,
      currentMedication: mh.currentMedication,
      chronicConditions: mh.chronicConditions,
      previousSurgeries: mh.previousSurgeries,
      familyHistory: mh.familyHistory,
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
    const { contactDetails: cd, personalInformation: pi, medicalAidDetails: ma, medicalHistory: mh } =
      update.toPersisted();

    await this.repo.update(
      { id },
      {
        email: cd.email,
        phoneNumber: cd.phone,
        altphone: cd.altphone,
        residentialAddress: cd.address,
        firstname: pi.firstname,
        lastname: pi.lastname,
        dateOfBirth: pi.dateOfBirth,
        gender: pi.gender,
        scheme: ma.scheme,
        memberNumber: ma.memberNumber,
        mainMember: ma.mainMember,
        mainMemberId: ma.mainMemberId,
        dependantCode: ma.dependantCode,
        allergies: mh.allergies,
        currentMedication: mh.currentMedication,
        chronicConditions: mh.chronicConditions,
        previousSurgeries: mh.previousSurgeries,
        familyHistory: mh.familyHistory,
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
    return RegistrationDocument.fromPersisted({
      id: entity.id,
      registrationRequestId: entity.registrationRequest.id,
      patientIdentityId: entity.patientIdentity.identity,
      email: entity.email,
      phoneNumber: entity.phoneNumber,
      altphone: entity.altphone,
      residentialAddress: entity.residentialAddress,
      firstname: entity.firstname,
      lastname: entity.lastname,
      dateOfBirth: entity.dateOfBirth,
      gender: entity.gender,
      scheme: entity.scheme,
      memberNumber: entity.memberNumber,
      mainMember: entity.mainMember,
      mainMemberId: entity.mainMemberId,
      dependantCode: entity.dependantCode,
      allergies: entity.allergies,
      currentMedication: entity.currentMedication,
      chronicConditions: entity.chronicConditions,
      previousSurgeries: entity.previousSurgeries,
      familyHistory: entity.familyHistory,
      submittedAt: entity.submittedAt,
    });
  }
}
