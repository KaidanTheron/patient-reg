import { MigrationInterface, QueryRunner } from "typeorm";

export class Initial1777032613792 implements MigrationInterface {
    name = 'Initial1777032613792'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "identity" ("id" SERIAL NOT NULL, "saId" character varying NOT NULL, CONSTRAINT "PK_ff16a44186b286d5e626178f726" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."auth_links_status_enum" AS ENUM('active', 'revoked')`);
        await queryRunner.query(`CREATE TABLE "auth_links" ("id" SERIAL NOT NULL, "uuid" uuid NOT NULL, "patient" character varying NOT NULL, "status" "public"."auth_links_status_enum" NOT NULL DEFAULT 'active', "createdBy" character varying NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "attemptCount" integer NOT NULL DEFAULT '0', CONSTRAINT "UQ_fafc0b1571ccc0b0e2a264bdcc2" UNIQUE ("uuid"), CONSTRAINT "PK_c179ec6b05431f098b609ee7314" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "auth_links"`);
        await queryRunner.query(`DROP TYPE "public"."auth_links_status_enum"`);
        await queryRunner.query(`DROP TABLE "identity"`);
    }

}
