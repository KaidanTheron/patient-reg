import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";
import { PracticeEntity } from "~/modules/registration/infrastructure/persistence/typeorm/entities/practice.entity";

@Entity({ name: "consent_templates" })
@Unique(["practice", "consentType", "version"])
export class ConsentTemplateEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => PracticeEntity, { nullable: false })
  @JoinColumn({ name: "practiceId" })
  practice: PracticeEntity;

  @Column({ type: "varchar" })
  consentType: string;

  @Column({ type: "varchar" })
  version: string;

  @Column({ type: "text" })
  text: string;

  @Column({ type: "boolean", default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
