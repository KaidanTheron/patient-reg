import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import {
  RegistrationService,
} from "./application/slices/registration";
import { Hasher } from "./domain/ports/hasher";
import { PatientIdentityRepository } from "./domain/ports/patient-identity.repository";
import { PracticeRepository } from "./domain/ports/practice.repository";
import { RegistrationRequestRepository } from "./domain/ports/registration-request.repository";
import { CryptoHasher } from "./infrastructure/security/crypto-hasher";
import { PatientIdentityEntity } from "./infrastructure/persistence/typeorm/entities/patient-identity.entity";
import { PracticeEntity } from "./infrastructure/persistence/typeorm/entities/practice.entity";
import { RegistrationRequestEntity } from "./infrastructure/persistence/typeorm/entities/registration-request.entity";
import { PatientIdentityRepository as TypeOrmPatientIdentityRepository } from "./infrastructure/persistence/typeorm/repositories/patient-identity.repository";
import { PracticeRepository as TypeOrmPracticeRepository } from "./infrastructure/persistence/typeorm/repositories/practice.repository";
import { RegistrationRequestRepository as TypeOrmRegistrationRequestRepository } from "./infrastructure/persistence/typeorm/repositories/registration-request.repository";
import { RegistrationResolver } from "./presentation/graphql/registration.resolver";
import { Notifier } from "./domain/ports/notifier";
import { ConsoleNotifier } from "./infrastructure/transport/console-notifier";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PatientIdentityEntity,
      PracticeEntity,
      RegistrationRequestEntity,
    ]),
  ],
  providers: [
    RegistrationService,
    RegistrationResolver,
    { provide: Hasher, useClass: CryptoHasher },
    { provide: Notifier, useClass: ConsoleNotifier },
    {
      provide: PatientIdentityRepository,
      useClass: TypeOrmPatientIdentityRepository,
    },
    {
      provide: RegistrationRequestRepository,
      useClass: TypeOrmRegistrationRequestRepository,
    },
    {
      provide: PracticeRepository,
      useClass: TypeOrmPracticeRepository,
    },
  ],
})
export class RegistrationModule {}
