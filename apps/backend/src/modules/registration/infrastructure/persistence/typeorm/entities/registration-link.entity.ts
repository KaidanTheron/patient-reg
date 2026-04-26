import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import {
  type RegistrationLinkStatusValue,
  registrationLinkStatusValues,
} from "../../../../domain/value-objects/registration-link-status";
import { PatientIdentityEntity } from "./patient-identity.entity";

@Entity({ name: "registration_links" })
@Index(["patientIdentity", "status"])
export class RegistrationLinkEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => PatientIdentityEntity, { nullable: false })
  @JoinColumn({ name: "patientIdentityId", referencedColumnName: "identity" })
  patientIdentity: PatientIdentityEntity;

  @Column({
    type: "enum",
    enum: registrationLinkStatusValues,
  })
  status: RegistrationLinkStatusValue;

  @Column({ type: "varchar" })
  createdByStaffId: string;

  @Column({ type: "timestamptz" })
  expiresAt: Date;

  @Column({ type: "int", default: 0 })
  attempts: number;

  @Column({ type: "int" })
  maxAttempts: number;
}
