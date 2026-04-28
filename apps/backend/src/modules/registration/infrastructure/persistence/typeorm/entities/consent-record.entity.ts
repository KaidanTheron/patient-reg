import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { PatientIdentityEntity } from "~/modules/registration/infrastructure/persistence/typeorm/entities/patient-identity.entity";
import { RegistrationRequestEntity } from "~/modules/registration/infrastructure/persistence/typeorm/entities/registration-request.entity";
import { ConsentTemplateEntity } from "~/modules/registration/infrastructure/persistence/typeorm/entities/consent-template.entity";

@Entity({ name: "consent_records" })
export class ConsentRecordEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @OneToOne(() => RegistrationRequestEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "registrationRequestId" })
  registrationRequest: RegistrationRequestEntity;

  @ManyToOne(() => PatientIdentityEntity, { nullable: false })
  @JoinColumn({ name: "patientIdentityId", referencedColumnName: "identity" })
  patientIdentity: PatientIdentityEntity;

  @ManyToOne(() => ConsentTemplateEntity, { nullable: false })
  @JoinColumn({ name: "consentTemplateId" })
  consentTemplate: ConsentTemplateEntity;

  @Column({ type: "timestamptz" })
  givenAt: Date;
}
