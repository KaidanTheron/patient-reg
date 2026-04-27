import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RegistrationService } from "./application/slices/registration";
import { ProtectedPatientSession } from "./application/support/protected-patient-session";
import { Hasher } from "./domain/ports/hasher";
import { PatientIdentityRepository } from "./domain/ports/patient-identity.repository";
import { PatientRecordRepository } from "./domain/ports/patient-record.repository";
import { PracticeRepository } from "./domain/ports/practice.repository";
import { PatientPracticeRepository } from "./domain/ports/patient-practice.repository";
import { RegistrationRequestRepository } from "./domain/ports/registration-request.repository";
import { RegistrationDocumentRepository } from "./domain/ports/registration-document.repository";
import { RegistrationLinkRepository } from "./domain/ports/registration-link.repository";
import { RegistrationLinkTokenSigner } from "./domain/ports/registration-link-token.signer";
import { RegistrationLinkFormatter } from "./domain/ports/registration-link.formatter";
import { PatientSessionTokenSigner } from "./domain/ports/patient-session-token.signer";
import { Encrypter } from "./domain/ports/encrypter";
import { CryptoEncrypter } from "./infrastructure/security/crypto-encrypter";
import { CryptoHasher } from "./infrastructure/security/crypto-hasher";
import { JwtRegistrationLinkTokenSigner } from "./infrastructure/security/jwt-registration-link-token.signer";
import { JwtPatientSessionTokenSigner } from "./infrastructure/security/jwt-patient-session-token.signer";
import { PatientIdentityEntity } from "./infrastructure/persistence/typeorm/entities/patient-identity.entity";
import { PatientRecordEntity } from "./infrastructure/persistence/typeorm/entities/patient-record.entity";
import { PracticeEntity } from "./infrastructure/persistence/typeorm/entities/practice.entity";
import { PatientPracticeEntity } from "./infrastructure/persistence/typeorm/entities/patient-practice.entity";
import { RegistrationRequestEntity } from "./infrastructure/persistence/typeorm/entities/registration-request.entity";
import { RegistrationLinkEntity } from "./infrastructure/persistence/typeorm/entities/registration-link.entity";
import { RegistrationDocumentEntity } from "./infrastructure/persistence/typeorm/entities/registration-document.entity";
import { PatientIdentityRepository as TypeOrmPatientIdentityRepository } from "./infrastructure/persistence/typeorm/repositories/patient-identity.repository";
import { TypeOrmPatientRecordRepository } from "./infrastructure/persistence/typeorm/repositories/patient-record.repository";
import { PracticeRepository as TypeOrmPracticeRepository } from "./infrastructure/persistence/typeorm/repositories/practice.repository";
import { TypeOrmPatientPracticeRepository } from "./infrastructure/persistence/typeorm/repositories/patient-practice.repository";
import { RegistrationRequestRepository as TypeOrmRegistrationRequestRepository } from "./infrastructure/persistence/typeorm/repositories/registration-request.repository";
import { TypeOrmRegistrationLinkRepository } from "./infrastructure/persistence/typeorm/repositories/registration-link.repository";
import { TypeOrmRegistrationDocumentRepository } from "./infrastructure/persistence/typeorm/repositories/registration-document.repository";
import { RegistrationResolver } from "./presentation/graphql/registration.resolver";
import { PatientSessionGuard } from "./presentation/graphql/patient-session.guard";
import { PracticeSessionGuard } from "./presentation/graphql/practice-session.guard";
import { Notifier } from "./domain/ports/notifier";
import { ConsoleNotifier } from "./infrastructure/transport/console-notifier";
import { StringRegistrationLinkFormatter } from "./infrastructure/transport/string-registration-link.formatter";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PatientIdentityEntity,
      PatientRecordEntity,
      PracticeEntity,
      PatientPracticeEntity,
      RegistrationRequestEntity,
      RegistrationLinkEntity,
      RegistrationDocumentEntity,
    ]),
  ],
  providers: [
    ProtectedPatientSession,
    PatientSessionGuard,
    PracticeSessionGuard,
    RegistrationService,
    RegistrationResolver,
    { provide: Hasher, useClass: CryptoHasher },
    { provide: Encrypter, useClass: CryptoEncrypter },
    { provide: Notifier, useClass: ConsoleNotifier },
    {
      provide: RegistrationLinkTokenSigner,
      useClass: JwtRegistrationLinkTokenSigner,
    },
    {
      provide: PatientSessionTokenSigner,
      useClass: JwtPatientSessionTokenSigner,
    },
    {
      provide: RegistrationLinkFormatter,
      useClass: StringRegistrationLinkFormatter,
    },
    {
      provide: PatientIdentityRepository,
      useClass: TypeOrmPatientIdentityRepository,
    },
    {
      provide: PatientRecordRepository,
      useClass: TypeOrmPatientRecordRepository,
    },
    {
      provide: RegistrationRequestRepository,
      useClass: TypeOrmRegistrationRequestRepository,
    },
    {
      provide: RegistrationLinkRepository,
      useClass: TypeOrmRegistrationLinkRepository,
    },
    {
      provide: PracticeRepository,
      useClass: TypeOrmPracticeRepository,
    },
    {
      provide: PatientPracticeRepository,
      useClass: TypeOrmPatientPracticeRepository,
    },
    {
      provide: RegistrationDocumentRepository,
      useClass: TypeOrmRegistrationDocumentRepository,
    },
  ],
})
export class RegistrationModule {}
