import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { PracticeEntity } from "~/modules/registration/infrastructure/persistence/typeorm/entities/practice.entity";
import { PatientIdentityEntity } from "~/modules/registration/infrastructure/persistence/typeorm/entities/patient-identity.entity";
import {
  type RegistrationRequestStatusValue,
  registrationRequestStatusValues,
} from "~/modules/registration/domain/value-objects/registration-status";

@Entity({ name: "registration_requests" })
@Index(["patientIdentity", "practice"], { unique: true })
export class RegistrationRequestEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => PatientIdentityEntity, { nullable: false })
  @JoinColumn({ name: "patientIdentityId", referencedColumnName: "identity" })
  patientIdentity: PatientIdentityEntity;

  @ManyToOne(() => PracticeEntity, { nullable: false })
  @JoinColumn({ name: "practiceId", referencedColumnName: "id" })
  practice: PracticeEntity;

  @Column({
    type: "enum",
    enum: registrationRequestStatusValues,
    default: "AWAITING_COMPLETION",
  })
  status: RegistrationRequestStatusValue;

  @Column({ type: "text", nullable: true })
  rejectionReason: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
