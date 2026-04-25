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
import { PracticeEntity } from "./practice.entity";

export const registrationRequestStatusValues = [
  "AWAITING_COMPLETION",
  "AWAITING_REVIEW",
  "APPROVED",
  "REJECTED",
] as const;

export type RegistrationRequestStatusValue =
  (typeof registrationRequestStatusValues)[number];

@Entity({ name: "registration_requests" })
@Index(["patientIdentityId", "practiceId"], { unique: true })
export class RegistrationRequestEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar" })
  patientIdentityId: string;

  @Column({ type: "uuid" })
  practiceId: string;

  @ManyToOne(() => PracticeEntity, { nullable: false })
  @JoinColumn({ name: "practiceId" })
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
