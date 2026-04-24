import { MigrationInterface, QueryRunner } from "typeorm";

export class AuthLink1777034157031 implements MigrationInterface {
    name = 'AuthLink1777034157031'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "identity" ADD CONSTRAINT "UQ_164a4d78fc2f11b72e60f93b52b" UNIQUE ("saId")`);
        await queryRunner.query(`ALTER TABLE "auth_links" ADD CONSTRAINT "FK_fdb674327fe9fe90e159a523ec7" FOREIGN KEY ("patient") REFERENCES "identity"("saId") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "auth_links" DROP CONSTRAINT "FK_fdb674327fe9fe90e159a523ec7"`);
        await queryRunner.query(`ALTER TABLE "identity" DROP CONSTRAINT "UQ_164a4d78fc2f11b72e60f93b52b"`);
    }

}
