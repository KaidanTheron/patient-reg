import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Identity } from "../../identity/identity.entity";
import { AuthLink } from "../auth-link.entity";
import { AuthLinkRepository } from "../domain/ports/auth-link.repository";
import { AuthLinkStatus } from "../domain/auth-link-status";
import type { AuthLinkState } from "../domain/auth-link.types";

@Injectable()
export class TypeOrmAuthLinkRepository extends AuthLinkRepository {
  constructor(
    @InjectRepository(AuthLink)
    private readonly repo: Repository<AuthLink>,
  ) {
    super();
  }

  async revokeAllActiveForPatient(patient: string): Promise<void> {
    await this.repo.update(
      { identity: { saId: patient }, status: AuthLinkStatus.ACTIVE },
      { status: AuthLinkStatus.REVOKED },
    );
  }

  async createNew(params: {
    patient: string;
    createdBy: string;
    expiresAt: Date;
  }): Promise<AuthLinkState> {
    const entity = this.repo.create({
      identity: { saId: params.patient } as Identity,
      createdBy: params.createdBy,
      expiresAt: params.expiresAt,
      status: AuthLinkStatus.ACTIVE,
      attemptCount: 0,
    });
    const saved = await this.repo.save(entity);
    return this.toState(saved);
  }

  async findByUuid(uuid: string): Promise<AuthLinkState | null> {
    const entity = await this.repo.findOne({ where: { uuid } });
    return entity ? this.toState(entity) : null;
  }

  async saveState(state: AuthLinkState): Promise<void> {
    const entity = await this.repo.findOne({ where: { id: state.id } });
    if (!entity) {
      return;
    }
    entity.status = state.status;
    entity.attemptCount = state.attemptCount;
    entity.expiresAt = state.expiresAt;
    entity.createdBy = state.createdBy;
    entity.identity = { saId: state.patient } as Identity;
    await this.repo.save(entity);
  }

  private toState(entity: AuthLink): AuthLinkState {
    return {
      id: entity.id,
      uuid: entity.uuid,
      patient: entity.identity.saId,
      status: entity.status,
      createdBy: entity.createdBy,
      expiresAt: entity.expiresAt,
      attemptCount: entity.attemptCount,
    };
  }
}
