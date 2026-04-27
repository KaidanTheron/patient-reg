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

  // ── ContactDetails ───────────────────────────────────────────────────────────
  @Column({ type: "text", nullable: true })
  email: string | null;

  @Column({ type: "text", nullable: true })
  phoneNumber: string | null;

  @Column({ type: "text", nullable: true })
  altphone: string | null;

  @Column({ type: "text", nullable: true })
  residentialAddress: string | null;

  // ── PersonalInformation ──────────────────────────────────────────────────────
  @Column({ type: "text", nullable: true })
  firstname: string | null;

  @Column({ type: "text", nullable: true })
  lastname: string | null;

  /** Encrypted ISO date string. */
  @Column({ type: "text", nullable: true })
  dateOfBirth: string | null;

  @Column({ type: "text", nullable: true })
  gender: string | null;

  // ── MedicalAidDetails ────────────────────────────────────────────────────────
  @Column({ type: "text", nullable: true })
  scheme: string | null;

  @Column({ type: "text", nullable: true })
  memberNumber: string | null;

  @Column({ type: "text", nullable: true })
  mainMember: string | null;

  @Column({ type: "text", nullable: true })
  mainMemberId: string | null;

  @Column({ type: "text", nullable: true })
  dependantCode: string | null;

  // ── MedicalHistory ───────────────────────────────────────────────────────────
  @Column({ type: "text", nullable: true })
  allergies: string | null;

  @Column({ type: "text", nullable: true })
  currentMedication: string | null;

  @Column({ type: "text", nullable: true })
  chronicConditions: string | null;

  @Column({ type: "text", nullable: true })
  previousSurgeries: string | null;

  @Column({ type: "text", nullable: true })
  familyHistory: string | null;

  @Column({ type: "timestamptz" })
  submittedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
