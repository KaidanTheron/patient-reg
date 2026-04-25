import { Injectable } from "@nestjs/common";
import { PatientIdentityRepository as Repository } from "../../../../domain/ports/patient-identity.repository";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository as TypeOrmRepository } from "typeorm";
import { PatientIdentityEntity } from "../entities/patient-identity.entity";
import { HashedRsaId } from "src/modules/registration/domain/value-objects/hashed-rsaid";

@Injectable()
export class PatientIdentityRepository extends Repository {
    constructor(
        @InjectRepository(PatientIdentityEntity)
        private readonly repo: TypeOrmRepository<PatientIdentityEntity>,
    ) {
        super();
    }

    exists(identity: HashedRsaId): Promise<boolean> {
        return this.repo.exists({ where: { identity: identity.toString() } });
    }
}