import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("identity")
export class Identity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    saId: string;
}
