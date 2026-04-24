import { Module } from '@nestjs/common';
import { IdentityService } from './application/identity.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Identity } from './identity.entity';
import { IdentityRepository } from './domain/ports/identity.repository';
import { TypeOrmIdentityRepository } from './infrastructure/typeorm-identity.repository';
import { IdentityHasher } from './domain/ports/identity.hasher';
import { CryptoIdentityHasher } from './infrastructure/crypto-identity.hasher';

@Module({
  imports: [TypeOrmModule.forFeature([Identity])],
  providers: [
    IdentityService,
    { provide: IdentityRepository, useClass: TypeOrmIdentityRepository },
    { provide: IdentityHasher, useClass: CryptoIdentityHasher }
  ],
  exports: [IdentityService, IdentityHasher],
})
export class IdentityModule {}
