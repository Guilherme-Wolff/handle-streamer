import { MigrationInterface, QueryRunner } from "typeorm"

export class DeleteAllUsers1694208767208 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DELETE FROM users');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {

    }
}
