import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { IdentityModule } from "../identity/identity.module";
import { AuthLinkService } from "./application/auth-link.service";
import { AuthLinkRepository } from "./domain/ports/auth-link.repository";
import { AuthLinkTokenSigner } from "./domain/ports/auth-link-token.signer";
import { AuthLinkNotifier } from "./domain/ports/auth-link.notifier";
import { AuthLinkFormatter } from "./domain/ports/auth-link.formatter";
import { AuthLink } from "./auth-link.entity";
import { ConsoleAuthLinkNotifier } from "./infrastructure/console-auth-link.notifier";
import { JwtAuthLinkTokenSigner } from "./infrastructure/jwt-auth-link-token.signer";
import { StringAuthLinkFormatter } from "./infrastructure/string-auth-link.formatter";
import { TypeOrmAuthLinkRepository } from "./infrastructure/typeorm-auth-link.repository";
import { AuthLinkResolver } from "./presentation/auth-link.resolver";

@Module({
  imports: [TypeOrmModule.forFeature([AuthLink]), IdentityModule],
  providers: [
    AuthLinkService,
    AuthLinkResolver,
    { provide: AuthLinkRepository, useClass: TypeOrmAuthLinkRepository },
    { provide: AuthLinkTokenSigner, useClass: JwtAuthLinkTokenSigner },
    { provide: AuthLinkNotifier, useClass: ConsoleAuthLinkNotifier },
    { provide: AuthLinkFormatter, useClass: StringAuthLinkFormatter },
  ],
  exports: [AuthLinkService],
})
export class AuthLinkModule {}
