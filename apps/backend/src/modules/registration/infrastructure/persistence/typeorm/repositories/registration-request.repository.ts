import { Injectable } from "@nestjs/common";
import { RegistrationRequestRepository as Repository } from "../../../../domain/ports/registration-request.repository";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository as TypeOrmRepository } from "typeorm";
import {
  RegistrationRequestEntity,
  RegistrationRequestStatusValue,
} from "../entities/registration-request.entity";
import {
  NewRegistrationRequest,
  RegistrationRequest,
} from "src/modules/registration/domain/entities/registration-request.entity";
import { RegistrationStatus } from "src/modules/registration/domain/value-objects/registration-status";
import { HashedRsaId } from "src/modules/registration/domain/value-objects/hashed-rsaid";

@Injectable()
export class RegistrationRequestRepository extends Repository {
  constructor(
    @InjectRepository(RegistrationRequestEntity)
    private readonly repo: TypeOrmRepository<RegistrationRequestEntity>,
  ) {
    super();
  }

  public async create(
    request: NewRegistrationRequest,
  ): Promise<RegistrationRequest> {
    const created = await this.repo.save({
      patientIdentityId: request.patientIdentityId.toString(),
      practiceId: request.practiceId,
    });
    return this.toDomain(created);
  }

  public async findById(
    id: RegistrationRequest["id"],
  ): Promise<RegistrationRequest | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  public async findByPatientAndPractice(
    patient: RegistrationRequest["patientIdentityId"],
    practice: RegistrationRequest["practiceId"],
  ): Promise<RegistrationRequest | null> {
    const entity = await this.repo.findOne({
      where: { patientIdentityId: patient.toString(), practiceId: practice },
    });
    return entity ? this.toDomain(entity) : null;
  }

  public async update(
    id: RegistrationRequest["id"],
    request: Partial<RegistrationRequest>,
  ): Promise<void> {
    const payload: Partial<RegistrationRequestEntity> = {
      patientIdentityId: request.patientIdentityId?.toString(),
      practiceId: request.practiceId,
      status: request.getStatus?.().toString() as
        | RegistrationRequestStatusValue
        | undefined,
      rejectionReason: request.getRejectionReason?.(),
    };

    await this.repo.update({ id }, payload);
  }

  private toDomain(entity: RegistrationRequestEntity): RegistrationRequest {
    return new RegistrationRequest(
      entity.id,
      HashedRsaId.fromPersisted(entity.patientIdentityId),
      entity.practiceId,
      this.toDomainStatus(entity.status),
      entity.rejectionReason ?? undefined,
    );
  }

  private toDomainStatus(
    status: RegistrationRequestStatusValue,
  ): RegistrationStatus {
    switch (status) {
      case "AWAITING_COMPLETION":
        return RegistrationStatus.awaitingCompletion();
      case "AWAITING_REVIEW":
        return RegistrationStatus.awaitingReview();
      case "APPROVED":
        return RegistrationStatus.approved();
      case "REJECTED":
        return RegistrationStatus.rejected();
      default: {
        const exhaustiveCheck: never = status;
        throw new Error(`Unknown registration status: ${exhaustiveCheck}`);
      }
    }
  }
}
