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

    @Column({ type: "text", nullable: false })
    email: string | null;

    @Column({ type: "text", nullable: false })
    phone: string | null;
}
  