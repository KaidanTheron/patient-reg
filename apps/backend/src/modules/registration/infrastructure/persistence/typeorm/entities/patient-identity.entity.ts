import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "patient_identities" })
export class PatientIdentityEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", unique: true })
  identity: string;

  @Column({ type: "text", nullable: true })
  email: string | null;

  @Column({ type: "text", nullable: true })
  phone: string | null;

  @Column({ type: "text", nullable: false })
  firstname: string | null;

  @Column({ type: "text", nullable: false })
  lastname: string | null;
}
