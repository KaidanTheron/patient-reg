import { Module } from '@nestjs/common';
import { IdentityService } from './application/identity/identity.service';
import { IdentityResolver } from './presentation/identity/identity.resolver';

@Module({
  providers: [IdentityService, IdentityResolver]
})
export class IdentityModule {}
