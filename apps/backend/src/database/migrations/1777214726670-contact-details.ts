import { MigrationInterface, QueryRunner } from "typeorm";

export class ContactDetails1777214726670 implements MigrationInterface {
    name = 'ContactDetails1777214726670'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "patient_identities" ADD "email" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "patient_identities" ADD "phone" text NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "patient_identities" DROP COLUMN "phone"`);
        await queryRunner.query(`ALTER TABLE "patient_identities" DROP COLUMN "email"`);
    }

}
