import { MigrationInterface, QueryRunner } from "typeorm";

export class Initial1777277387323 implements MigrationInterface {
    name = 'Initial1777277387323'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "practices" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, CONSTRAINT "PK_0934829c5859a843625e6ff1c34" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "patient_identities" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "identity" character varying NOT NULL, "email" text NOT NULL, "phone" text NOT NULL, CONSTRAINT "UQ_f6579f372450f38bb06d001cda1" UNIQUE ("identity"), CONSTRAINT "PK_5b40aeddb0d56cc3630eb2bca01" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."registration_requests_status_enum" AS ENUM('AWAITING_COMPLETION', 'AWAITING_REVIEW', 'APPROVED', 'REJECTED')`);
        await queryRunner.query(`CREATE TABLE "registration_requests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" "public"."registration_requests_status_enum" NOT NULL DEFAULT 'AWAITING_COMPLETION', "rejectionReason" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "patientIdentityId" character varying NOT NULL, "practiceId" uuid NOT NULL, CONSTRAINT "PK_75e49f863f30250e82ab8638eaa" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_d06389ad9cff37c9efa0589f2b" ON "registration_requests" ("patientIdentityId", "practiceId") `);
        await queryRunner.query(`CREATE TYPE "public"."registration_links_status_enum" AS ENUM('ACTIVE', 'REVOKED')`);
        await queryRunner.query(`CREATE TABLE "registration_links" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" "public"."registration_links_status_enum" NOT NULL, "createdByStaffId" character varying NOT NULL, "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "attempts" integer NOT NULL DEFAULT '0', "maxAttempts" integer NOT NULL, "patientIdentityId" character varying NOT NULL, CONSTRAINT "PK_08c3b2b77de8419b7dce0bb4b1f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_085edb34a90bb0510286d7bb12" ON "registration_links" ("patientIdentityId", "status") `);
        await queryRunner.query(`CREATE TABLE "registration_documents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" text NOT NULL, "phoneNumber" text NOT NULL, "residentialAddress" text NOT NULL, "submittedAt" TIMESTAMP WITH TIME ZONE NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "registrationRequestId" uuid, "patientIdentityId" character varying NOT NULL, CONSTRAINT "REL_7b86292a3eb0c73381335357b7" UNIQUE ("registrationRequestId"), CONSTRAINT "PK_b7c0d11b37eb60171a8304833ef" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "patient_records" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" text, "phoneNumber" text, "residentialAddress" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "patientIdentityId" character varying NOT NULL, CONSTRAINT "PK_146301514bbccff6c5138b36db4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "patient_practices" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "patientIdentityId" character varying NOT NULL, "practiceId" uuid NOT NULL, CONSTRAINT "PK_5d96906f254a49274b4435bbecb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_7016ca68d3d7f5112c1786bcab" ON "patient_practices" ("patientIdentityId", "practiceId") `);
        await queryRunner.query(`ALTER TABLE "registration_requests" ADD CONSTRAINT "FK_71d8258b5884f522d515f32f94c" FOREIGN KEY ("patientIdentityId") REFERENCES "patient_identities"("identity") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "registration_requests" ADD CONSTRAINT "FK_4ffe35fc5569866017226afb6e0" FOREIGN KEY ("practiceId") REFERENCES "practices"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "registration_links" ADD CONSTRAINT "FK_b6387a72fabcd6b650e00c8d173" FOREIGN KEY ("patientIdentityId") REFERENCES "patient_identities"("identity") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "registration_documents" ADD CONSTRAINT "FK_7b86292a3eb0c73381335357b72" FOREIGN KEY ("registrationRequestId") REFERENCES "registration_requests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "registration_documents" ADD CONSTRAINT "FK_1c72bac7b79229b2ca447b81383" FOREIGN KEY ("patientIdentityId") REFERENCES "patient_identities"("identity") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "patient_records" ADD CONSTRAINT "FK_6bdc92dff49cafa1671dd5fc6b5" FOREIGN KEY ("patientIdentityId") REFERENCES "patient_identities"("identity") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "patient_practices" ADD CONSTRAINT "FK_8155cb88beebd3b888e334367c1" FOREIGN KEY ("patientIdentityId") REFERENCES "patient_identities"("identity") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "patient_practices" ADD CONSTRAINT "FK_733aefe0ad0d9913d46e4a23e85" FOREIGN KEY ("practiceId") REFERENCES "practices"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "patient_practices" DROP CONSTRAINT "FK_733aefe0ad0d9913d46e4a23e85"`);
        await queryRunner.query(`ALTER TABLE "patient_practices" DROP CONSTRAINT "FK_8155cb88beebd3b888e334367c1"`);
        await queryRunner.query(`ALTER TABLE "patient_records" DROP CONSTRAINT "FK_6bdc92dff49cafa1671dd5fc6b5"`);
        await queryRunner.query(`ALTER TABLE "registration_documents" DROP CONSTRAINT "FK_1c72bac7b79229b2ca447b81383"`);
        await queryRunner.query(`ALTER TABLE "registration_documents" DROP CONSTRAINT "FK_7b86292a3eb0c73381335357b72"`);
        await queryRunner.query(`ALTER TABLE "registration_links" DROP CONSTRAINT "FK_b6387a72fabcd6b650e00c8d173"`);
        await queryRunner.query(`ALTER TABLE "registration_requests" DROP CONSTRAINT "FK_4ffe35fc5569866017226afb6e0"`);
        await queryRunner.query(`ALTER TABLE "registration_requests" DROP CONSTRAINT "FK_71d8258b5884f522d515f32f94c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7016ca68d3d7f5112c1786bcab"`);
        await queryRunner.query(`DROP TABLE "patient_practices"`);
        await queryRunner.query(`DROP TABLE "patient_records"`);
        await queryRunner.query(`DROP TABLE "registration_documents"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_085edb34a90bb0510286d7bb12"`);
        await queryRunner.query(`DROP TABLE "registration_links"`);
        await queryRunner.query(`DROP TYPE "public"."registration_links_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d06389ad9cff37c9efa0589f2b"`);
        await queryRunner.query(`DROP TABLE "registration_requests"`);
        await queryRunner.query(`DROP TYPE "public"."registration_requests_status_enum"`);
        await queryRunner.query(`DROP TABLE "patient_identities"`);
        await queryRunner.query(`DROP TABLE "practices"`);
    }

}
