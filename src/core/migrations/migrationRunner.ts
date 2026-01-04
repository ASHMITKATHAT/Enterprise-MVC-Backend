import mongoose from 'mongoose';
import { logger } from '../../config/logger';

export interface Migration {
  id: string;
  name: string;
  description: string;
  up(): Promise<void>;
  down(): Promise<void>;
}

interface MigrationRecord {
  id: string;
  name: string;
  executedAt: Date;
  duration: number;
  checksum: string;
}

export class MigrationRunner {
  private migrations: Migration[] = [];
  private collectionName = '_migrations';

  register(migration: Migration): void {
    this.migrations.push(migration);
    this.migrations.sort((a, b) => a.id.localeCompare(b.id));
  }

  async runPending(): Promise<void> {
    const executed = await this.getExecutedIds();
    const pending = this.migrations.filter(m => !executed.has(m.id));

    if (pending.length === 0) {
      logger.info('No pending migrations');
      return;
    }

    logger.info(`Running ${pending.length} pending migrations`);

    for (const migration of pending) {
      await this.runMigration(migration);
    }
  }

  async rollback(steps: number = 1): Promise<void> {
    const executed = await this.getExecutedRecords();
    const toRollback = executed.slice(-steps).reverse();

    for (const record of toRollback) {
      const migration = this.migrations.find(m => m.id === record.id);
      if (migration) {
        logger.info(`Rolling back migration: ${migration.name}`);
        await migration.down();
        await this.removeRecord(migration.id);
        logger.info(`Rolled back migration: ${migration.name}`);
      }
    }
  }

  async getStatus(): Promise<{ executed: MigrationRecord[]; pending: Migration[] }> {
    const executed = await this.getExecutedRecords();
    const executedIds = new Set(executed.map(r => r.id));
    const pending = this.migrations.filter(m => !executedIds.has(m.id));
    return { executed, pending };
  }

  private async runMigration(migration: Migration): Promise<void> {
    const start = Date.now();
    logger.info(`Running migration: ${migration.name} (${migration.id})`);

    try {
      await migration.up();
      const duration = Date.now() - start;
      const checksum = this.computeChecksum(migration);

      await this.recordMigration(migration, duration, checksum);
      logger.info(`Migration completed: ${migration.name} (${duration}ms)`);
    } catch (error: any) {
      logger.error(`Migration failed: ${migration.name} - ${error.message}`);
      throw error;
    }
  }

  private async getExecutedIds(): Promise<Set<string>> {
    const records = await this.getExecutedRecords();
    return new Set(records.map(r => r.id));
  }

  private async getExecutedRecords(): Promise<MigrationRecord[]> {
    try {
      const collection = mongoose.connection.collection(this.collectionName);
      return await collection.find().sort({ id: 1 }).toArray() as unknown as MigrationRecord[];
    } catch {
      return [];
    }
  }

  private async recordMigration(migration: Migration, duration: number, checksum: string): Promise<void> {
    const collection = mongoose.connection.collection(this.collectionName);
    await collection.insertOne({
      id: migration.id,
      name: migration.name,
      executedAt: new Date(),
      duration,
      checksum,
    });
  }

  private async removeRecord(id: string): Promise<void> {
    const collection = mongoose.connection.collection(this.collectionName);
    await collection.deleteOne({ id });
  }

  private computeChecksum(migration: Migration): string {
    let hash = 0;
    const str = migration.up.toString() + migration.down.toString();
    for (let i = 0; i < str.length; i++) {
      const chr = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0;
    }
    return hash.toString(16);
  }
}

export const migrationRunner = new MigrationRunner();

// Updated on 2026-01-04 14:23:00
