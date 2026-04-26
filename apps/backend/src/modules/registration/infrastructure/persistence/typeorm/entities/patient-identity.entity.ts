import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
} from "typeorm";
   
@Entity({ name: "patient_identities" })
export class PatientIdentityEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "varchar", unique: true })
    identity: string;
}
  