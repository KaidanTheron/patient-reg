import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "practices" })
export class PracticeEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar" })
  name: string;
}
