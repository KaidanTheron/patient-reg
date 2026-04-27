import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { PatientIdentityEntity } from "~/modules/registration/infrastructure/persistence/typeorm/entities/patient-identity.entity";
import { RegistrationRequestEntity } from "~/modules/registration/infrastructure/persistence/typeorm/entities/registration-request.entity";

@Entity({ name: "registration_documents" })
export class RegistrationDocumentEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @OneToOne(() => RegistrationRequestEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "registrationRequestId" })
  registrationRequest: RegistrationRequestEntity;

  @ManyToOne(() => PatientIdentityEntity, { nullable: false })
  @JoinColumn({ name: "patientIdentityId", referencedColumnName: "identity" })
  patientIdentity: PatientIdentityEntity;

  @Column({ type: "text" })
  email: string;

  @Column({ type: "text" })
  phoneNumber: string;

  @Column({ type: "text" })
  residentialAddress: string;

  @Column({ type: "text", nullable: true })
  fullName: string | null;

  /** Encrypted; typically `YYYY-MM-DD` plaintext before encryption. */
  @Column({ type: "text", nullable: true })
  dateOfBirth: string | null;

  @Column({ type: "timestamptz" })
  submittedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
