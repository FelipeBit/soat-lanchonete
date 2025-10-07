import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCustomerCPFToOrders1710000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE orders
      ADD COLUMN "customerCPF" varchar NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE orders
      DROP COLUMN "customerCPF";
    `);
  }
}
