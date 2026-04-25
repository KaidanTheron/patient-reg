import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
} from "typeorm";
  
export const registrationRequestStatusValues = [
    "AWAITING_COMPLETION",
    "AWAITING_REVIEW",
    "APPROVED",
    "REJECTED",
] as const;
  
export type RegistrationRequestStatusValue = (typeof registrationRequestStatusValues)[number];
  
@Entity({ name: "patient_identities" })
export class PatientIdentityEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "varchar" })
    identity: string;
}
  