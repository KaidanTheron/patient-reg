import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RegistrationService } from "~/modules/registration/application/slices/registration";
import { ProtectedPatientSession } from "~/modules/registration/application/support/protected-patient-session";
import { Hasher } from "~/modules/registration/domain/ports/hasher";
import { PatientIdentityRepository } from "~/modules/registration/domain/ports/patient-identity.repository";
import { PatientRecordRepository } from "~/modules/registration/domain/ports/patient-record.repository";
import { PracticeRepository } from "~/modules/registration/domain/ports/practice.repository";
import { PatientPracticeRepository } from "~/modules/registration/domain/ports/patient-practice.repository";
import { RegistrationRequestRepository } from "~/modules/registration/domain/ports/registration-request.repository";
import { RegistrationDocumentRepository } from "~/modules/registration/domain/ports/registration-document.repository";
import { RegistrationLinkRepository } from "~/modules/registration/domain/ports/registration-link.repository";
import { RegistrationLinkTokenSigner } from "~/modules/registration/domain/ports/registration-link-token.signer";
import { RegistrationLinkFormatter } from "~/modules/registration/domain/ports/registration-link.formatter";
import { PatientSessionTokenSigner } from "~/modules/registration/domain/ports/patient-session-token.signer";
import { Encrypter } from "~/modules/registration/domain/ports/encrypter";
import { ConsentTemplateRepository } from "~/modules/registration/domain/ports/consent-template.repository";
import { ConsentRecordRepository } from "~/modules/registration/domain/ports/consent-record.repository";
import { CryptoEncrypter } from "~/modules/registration/infrastructure/security/crypto-encrypter";
import { CryptoHasher } from "~/modules/registration/infrastructure/security/crypto-hasher";
import { JwtRegistrationLinkTokenSigner } from "~/modules/registration/infrastructure/security/jwt-registration-link-token.signer";
import { JwtPatientSessionTokenSigner } from "~/modules/registration/infrastructure/security/jwt-patient-session-token.signer";
import { PatientIdentityEntity } from "~/modules/registration/infrastructure/persistence/typeorm/entities/patient-identity.entity";
import { PatientRecordEntity } from "~/modules/registration/infrastructure/persistence/typeorm/entities/patient-record.entity";
import { PracticeEntity } from "~/modules/registration/infrastructure/persistence/typeorm/entities/practice.entity";
import { PatientPracticeEntity } from "~/modules/registration/infrastructure/persistence/typeorm/entities/patient-practice.entity";
import { RegistrationRequestEntity } from "~/modules/registration/infrastructure/persistence/typeorm/entities/registration-request.entity";
import { RegistrationLinkEntity } from "~/modules/registration/infrastructure/persistence/typeorm/entities/registration-link.entity";
import { RegistrationDocumentEntity } from "~/modules/registration/infrastructure/persistence/typeorm/entities/registration-document.entity";
import { ConsentTemplateEntity } from "~/modules/registration/infrastructure/persistence/typeorm/entities/consent-template.entity";
import { ConsentRecordEntity } from "~/modules/registration/infrastructure/persistence/typeorm/entities/consent-record.entity";
import { PatientIdentityRepository as TypeOrmPatientIdentityRepository } from "~/modules/registration/infrastructure/persistence/typeorm/repositories/patient-identity.repository";
import { TypeOrmPatientRecordRepository } from "~/modules/registration/infrastructure/persistence/typeorm/repositories/patient-record.repository";
import { PracticeRepository as TypeOrmPracticeRepository } from "~/modules/registration/infrastructure/persistence/typeorm/repositories/practice.repository";
import { TypeOrmPatientPracticeRepository } from "~/modules/registration/infrastructure/persistence/typeorm/repositories/patient-practice.repository";
import { RegistrationRequestRepository as TypeOrmRegistrationRequestRepository } from "~/modules/registration/infrastructure/persistence/typeorm/repositories/registration-request.repository";
import { TypeOrmRegistrationLinkRepository } from "~/modules/registration/infrastructure/persistence/typeorm/repositories/registration-link.repository";
import { TypeOrmRegistrationDocumentRepository } from "~/modules/registration/infrastructure/persistence/typeorm/repositories/registration-document.repository";
import { TypeOrmConsentTemplateRepository } from "~/modules/registration/infrastructure/persistence/typeorm/repositories/consent-template.repository";
import { TypeOrmConsentRecordRepository } from "~/modules/registration/infrastructure/persistence/typeorm/repositories/consent-record.repository";
import { RegistrationResolver } from "~/modules/registration/presentation/graphql/registration.resolver";
import { PatientSessionGuard } from "~/modules/registration/presentation/graphql/patient-session.guard";
import { PracticeSessionGuard } from "~/modules/registration/presentation/graphql/practice-session.guard";
import { Notifier } from "~/modules/registration/domain/ports/notifier";
import { ConsoleNotifier } from "~/modules/registration/infrastructure/transport/console-notifier";
import { StringRegistrationLinkFormatter } from "~/modules/registration/infrastructure/transport/string-registration-link.formatter";

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
      ConsentTemplateEntity,
      ConsentRecordEntity,
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
    {
      provide: ConsentTemplateRepository,
      useClass: TypeOrmConsentTemplateRepository,
    },
    {
      provide: ConsentRecordRepository,
      useClass: TypeOrmConsentRecordRepository,
    },
  ],
})
export class RegistrationModule {}
