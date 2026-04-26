import {
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { PatientIdentityEntity } from "./patient-identity.entity";
import { PracticeEntity } from "./practice.entity";

@Entity({ name: "patient_practices" })
@Index(["patientIdentity", "practice"], { unique: true })
export class PatientPracticeEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => PatientIdentityEntity, { nullable: false })
  @JoinColumn({ name: "patientIdentityId", referencedColumnName: "identity" })
  patientIdentity: PatientIdentityEntity;

  @ManyToOne(() => PracticeEntity, { nullable: false })
  @JoinColumn({ name: "practiceId", referencedColumnName: "id" })
  practice: PracticeEntity;

  @CreateDateColumn()
  createdAt: Date;
}
