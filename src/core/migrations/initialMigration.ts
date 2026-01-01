import { Migration, migrationRunner } from './migrationRunner';
import mongoose from 'mongoose';
import { logger } from '../../config/logger';

const initialMigration: Migration = {
  id: '001',
  name: 'Initial schema setup',
  description: 'Creates base collections, indexes, and default data',
  async up() {
    const db = mongoose.connection.db;
    if (!db) throw new Error('Database not connected');

    const collections = await db.listCollections().toArray();
    const existing = new Set(collections.map(c => c.name));

    if (!existing.has('_migrations')) {
      await db.createCollection('_migrations');
      logger.info('Created _migrations collection');
    }

    const userCollection = mongoose.connection.collection('7b83_users');
    await userCollection.createIndex({ email: 1 }, { unique: true });
    await userCollection.createIndex({ username: 1 }, { unique: true });
    await userCollection.createIndex({ role: 1 });
    logger.info('Created user indexes');

    const queryCollection = mongoose.connection.collection('7b83_queries');
    await queryCollection.createIndex({ createdAt: -1 });
    await queryCollection.createIndex({ 'insights.status': 1 });
    await queryCollection.createIndex({ query: 'text', context: 'text' });
    logger.info('Created query indexes');
  },
  async down() {
    const db = mongoose.connection.db;
    if (!db) throw new Error('Database not connected');
    await db.collection('7b83_users').dropIndexes();
    await db.collection('7b83_queries').dropIndexes();
    logger.info('Dropped indexes from initial migration');
  },
};

migrationRunner.register(initialMigration);
