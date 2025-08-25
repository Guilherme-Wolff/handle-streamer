import { MigrationInterface, QueryRunner } from "typeorm"

export class UpdadeUsersColunPremium1694208463977 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE users RENAME COLUMN role TO premium`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE users RENAME COLUMN role TO premium`);
    }

}
