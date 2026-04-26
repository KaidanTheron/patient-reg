import { MigrationInterface, QueryRunner } from "typeorm";

export class AuthLinks1777200151101 implements MigrationInterface {
    name = 'AuthLinks1777200151101'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "practices" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, CONSTRAINT "PK_0934829c5859a843625e6ff1c34" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."registration_links_status_enum" AS ENUM('ACTIVE', 'REVOKED')`);
        await queryRunner.query(`CREATE TABLE "registration_links" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" "public"."registration_links_status_enum" NOT NULL, "createdByStaffId" character varying NOT NULL, "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "attempts" integer NOT NULL DEFAULT '0', "maxAttempts" integer NOT NULL, "patientIdentityId" character varying NOT NULL, CONSTRAINT "PK_08c3b2b77de8419b7dce0bb4b1f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_085edb34a90bb0510286d7bb12" ON "registration_links" ("patientIdentityId", "status") `);
        await queryRunner.query(`ALTER TABLE "patient_identities" ADD CONSTRAINT "UQ_f6579f372450f38bb06d001cda1" UNIQUE ("identity")`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d06389ad9cff37c9efa0589f2b"`);
        await queryRunner.query(`ALTER TABLE "registration_requests" DROP COLUMN "practiceId"`);
        await queryRunner.query(`ALTER TABLE "registration_requests" ADD "practiceId" uuid NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_d06389ad9cff37c9efa0589f2b" ON "registration_requests" ("patientIdentityId", "practiceId") `);
        await queryRunner.query(`ALTER TABLE "registration_requests" ADD CONSTRAINT "FK_71d8258b5884f522d515f32f94c" FOREIGN KEY ("patientIdentityId") REFERENCES "patient_identities"("identity") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "registration_requests" ADD CONSTRAINT "FK_4ffe35fc5569866017226afb6e0" FOREIGN KEY ("practiceId") REFERENCES "practices"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "registration_links" ADD CONSTRAINT "FK_b6387a72fabcd6b650e00c8d173" FOREIGN KEY ("patientIdentityId") REFERENCES "patient_identities"("identity") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "registration_links" DROP CONSTRAINT "FK_b6387a72fabcd6b650e00c8d173"`);
        await queryRunner.query(`ALTER TABLE "registration_requests" DROP CONSTRAINT "FK_4ffe35fc5569866017226afb6e0"`);
        await queryRunner.query(`ALTER TABLE "registration_requests" DROP CONSTRAINT "FK_71d8258b5884f522d515f32f94c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d06389ad9cff37c9efa0589f2b"`);
        await queryRunner.query(`ALTER TABLE "registration_requests" DROP COLUMN "practiceId"`);
        await queryRunner.query(`ALTER TABLE "registration_requests" ADD "practiceId" character varying NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_d06389ad9cff37c9efa0589f2b" ON "registration_requests" ("patientIdentityId", "practiceId") `);
        await queryRunner.query(`ALTER TABLE "patient_identities" DROP CONSTRAINT "UQ_f6579f372450f38bb06d001cda1"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_085edb34a90bb0510286d7bb12"`);
        await queryRunner.query(`DROP TABLE "registration_links"`);
        await queryRunner.query(`DROP TYPE "public"."registration_links_status_enum"`);
        await queryRunner.query(`DROP TABLE "practices"`);
    }

}
