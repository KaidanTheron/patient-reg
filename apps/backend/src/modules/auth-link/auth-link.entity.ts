import {
  BeforeInsert,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { randomUUID } from "crypto";
import { AuthLinkStatus } from "./domain/auth-link-status";
import { Identity } from "../identity/identity.entity";

@Entity("auth_links")
export class AuthLink {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "uuid", unique: true })
  uuid: string;

  @BeforeInsert()
  setUuid(): void {
    if (!this.uuid) {
      this.uuid = randomUUID();
    }
  }

  @ManyToOne(() => Identity, { nullable: false, eager: true })
  @JoinColumn({ name: "patient", referencedColumnName: "saId" })
  identity: Identity;

  @Column({
    type: "enum",
    enum: AuthLinkStatus,
    default: AuthLinkStatus.ACTIVE,
  })
  status: AuthLinkStatus;

  @Column()
  createdBy: string;

  @Column()
  expiresAt: Date;

  @Column({
    default: 0,
  })
  attemptCount: number;
}
