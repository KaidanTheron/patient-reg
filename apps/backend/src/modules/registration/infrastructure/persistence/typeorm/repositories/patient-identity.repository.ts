import { Injectable } from "@nestjs/common";
import { PatientIdentityRepository as Repository } from "../../../../domain/ports/patient-identity.repository";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository as TypeOrmRepository } from "typeorm";
import { PatientIdentityEntity } from "../entities/patient-identity.entity";
import { HashedRsaId } from "src/modules/registration/domain/value-objects/hashed-rsaid";
import { PatientIdentity } from "src/modules/registration/domain/entities/patient-identity.entity";
import { EncryptedValue } from "src/modules/registration/domain/value-objects/encrypted-value";

@Injectable()
export class PatientIdentityRepository extends Repository {
    constructor(
        @InjectRepository(PatientIdentityEntity)
        private readonly repo: TypeOrmRepository<PatientIdentityEntity>,
    ) {
        super();
    }

    public async exists(identity: HashedRsaId): Promise<boolean> {
        return this.repo.exists({ where: { identity: identity.toString() } });
    }

    public async findById(identity: HashedRsaId): Promise<PatientIdentity | null> {
        const entity = await this.repo.findOne({
            where: { identity: identity.toString() },
        });

        if (!entity) return null;

        return this.toDomain(entity);
    }

    private toDomain(entity: PatientIdentityEntity): PatientIdentity {
        return new PatientIdentity(
            HashedRsaId.fromPersisted(entity.identity),
            entity.email
                ? EncryptedValue.fromPersisted(entity.email)
                : undefined,
            entity.phone
                ? EncryptedValue.fromPersisted(entity.phone)
                : undefined,
        );
    }
}