import { Injectable } from "@nestjs/common";
import { IdentityRepository } from "../domain/ports/identity.repository";
import { Repository } from "typeorm";
import { Identity } from "../identity.entity";
import { InjectRepository } from "@nestjs/typeorm";

@Injectable()
export class TypeOrmIdentityRepository extends IdentityRepository {
    constructor(
        @InjectRepository(Identity)
        private readonly repo: Repository<Identity>
    ) {
        super()
    }

    public async createNew(id: string): Promise<void> {
        this.repo.save({ saId: id })
    }

    public exists(id: string): Promise<boolean> {
        return this.repo.exists({ where: { saId: id }});
    }
}