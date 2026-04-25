import { MigrationInterface, QueryRunner } from "typeorm";

export class Initial1777129877440 implements MigrationInterface {
    name = 'Initial1777129877440'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."registration_requests_status_enum" AS ENUM('AWAITING_COMPLETION', 'AWAITING_REVIEW', 'APPROVED', 'REJECTED')`);
        await queryRunner.query(`CREATE TABLE "registration_requests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "patientIdentityId" character varying NOT NULL, "practiceId" character varying NOT NULL, "status" "public"."registration_requests_status_enum" NOT NULL DEFAULT 'AWAITING_COMPLETION', "rejectionReason" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_75e49f863f30250e82ab8638eaa" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_d06389ad9cff37c9efa0589f2b" ON "registration_requests" ("patientIdentityId", "practiceId") `);
        await queryRunner.query(`CREATE TABLE "patient_identities" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "identity" character varying NOT NULL, CONSTRAINT "PK_5b40aeddb0d56cc3630eb2bca01" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "patient_identities"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d06389ad9cff37c9efa0589f2b"`);
        await queryRunner.query(`DROP TABLE "registration_requests"`);
        await queryRunner.query(`DROP TYPE "public"."registration_requests_status_enum"`);
    }

}
