import { Injectable } from '@nestjs/common';
import { IdentityHasher } from '../domain/ports/identity.hasher';
import { IdentityRepository } from '../domain/ports/identity.repository';

@Injectable()
export class IdentityService {
    constructor(
        private readonly hasher: IdentityHasher,
        private readonly identies: IdentityRepository
    ) {}

    public async findIfHashedIdExists(id: string): Promise<boolean> {
        const hashedId = await this.hasher.hash(id);
        return this.identies.exists(hashedId);
    }
}
