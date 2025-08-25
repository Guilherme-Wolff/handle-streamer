import { MigrationInterface, QueryRunner } from "typeorm";

export class DeleteAllUsers1694214312072 implements MigrationInterface {
    name = 'DeleteAllUsers1694214312072'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "role" TO "premium"`);
        await queryRunner.query(`CREATE TABLE "schedules" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "streamer" character varying NOT NULL, "scheduledTime" TIMESTAMP NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7e33fc2ea755a5765e3564e66dd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "premium"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "premium" boolean NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "premium"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "premium" character varying NOT NULL DEFAULT 'customer'`);
        await queryRunner.query(`DROP TABLE "schedules"`);
        await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "premium" TO "role"`);
    }

}
