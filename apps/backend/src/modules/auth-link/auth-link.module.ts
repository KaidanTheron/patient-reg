import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthLinkService } from "./application/auth-link.service";
import { AuthLinkRepository } from "./domain/ports/auth-link.repository";
import { AuthLinkTokenSigner } from "./domain/ports/auth-link-token.signer";
import { AuthLink } from "./auth-link.entity";
import { JwtAuthLinkTokenSigner } from "./infrastructure/jwt-auth-link-token.signer";
import { TypeOrmAuthLinkRepository } from "./infrastructure/typeorm-auth-link.repository";
import { AuthLinkResolver } from "./presentation/auth-link.resolver";

@Module({
  imports: [TypeOrmModule.forFeature([AuthLink])],
  providers: [
    AuthLinkService,
    AuthLinkResolver,
    { provide: AuthLinkRepository, useClass: TypeOrmAuthLinkRepository },
    { provide: AuthLinkTokenSigner, useClass: JwtAuthLinkTokenSigner },
  ],
  exports: [AuthLinkService],
})
export class AuthLinkModule {}
