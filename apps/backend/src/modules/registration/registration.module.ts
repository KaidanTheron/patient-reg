import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import {
  RegistrationService,
} from "./application/slices/registration";
import { Hasher } from "./domain/ports/hasher";
import { PatientIdentityRepository } from "./domain/ports/patient-identity.repository";
import { PracticeRepository } from "./domain/ports/practice.repository";
import { RegistrationRequestRepository } from "./domain/ports/registration-request.repository";
import { RegistrationLinkRepository } from "./domain/ports/registration-link.repository";
import { RegistrationLinkTokenSigner } from "./domain/ports/registration-link-token.signer";
import { RegistrationLinkFormatter } from "./domain/ports/registration-link.formatter";
import { CryptoHasher } from "./infrastructure/security/crypto-hasher";
import { JwtRegistrationLinkTokenSigner } from "./infrastructure/security/jwt-registration-link-token.signer";
import { PatientIdentityEntity } from "./infrastructure/persistence/typeorm/entities/patient-identity.entity";
import { PracticeEntity } from "./infrastructure/persistence/typeorm/entities/practice.entity";
import { RegistrationRequestEntity } from "./infrastructure/persistence/typeorm/entities/registration-request.entity";
import { RegistrationLinkEntity } from "./infrastructure/persistence/typeorm/entities/registration-link.entity";
import { PatientIdentityRepository as TypeOrmPatientIdentityRepository } from "./infrastructure/persistence/typeorm/repositories/patient-identity.repository";
import { PracticeRepository as TypeOrmPracticeRepository } from "./infrastructure/persistence/typeorm/repositories/practice.repository";
import { RegistrationRequestRepository as TypeOrmRegistrationRequestRepository } from "./infrastructure/persistence/typeorm/repositories/registration-request.repository";
import { TypeOrmRegistrationLinkRepository } from "./infrastructure/persistence/typeorm/repositories/registration-link.repository";
import { RegistrationResolver } from "./presentation/graphql/registration.resolver";
import { Notifier } from "./domain/ports/notifier";
import { ConsoleNotifier } from "./infrastructure/transport/console-notifier";
import { StringRegistrationLinkFormatter } from "./infrastructure/transport/string-registration-link.formatter";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PatientIdentityEntity,
      PracticeEntity,
      RegistrationRequestEntity,
      RegistrationLinkEntity,
    ]),
  ],
  providers: [
    RegistrationService,
    RegistrationResolver,
    { provide: Hasher, useClass: CryptoHasher },
    { provide: Notifier, useClass: ConsoleNotifier },
    { provide: RegistrationLinkTokenSigner, useClass: JwtRegistrationLinkTokenSigner },
    { provide: RegistrationLinkFormatter, useClass: StringRegistrationLinkFormatter },
    {
      provide: PatientIdentityRepository,
      useClass: TypeOrmPatientIdentityRepository,
    },
    {
      provide: RegistrationRequestRepository,
      useClass: TypeOrmRegistrationRequestRepository,
    },
    { provide: RegistrationLinkRepository, useClass: TypeOrmRegistrationLinkRepository },
    {
      provide: PracticeRepository,
      useClass: TypeOrmPracticeRepository,
    },
  ],
})
export class RegistrationModule {}
