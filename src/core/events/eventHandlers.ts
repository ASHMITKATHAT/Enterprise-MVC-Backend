import { eventBus } from './eventBus';
import { logger } from '../../config/logger';

export const SystemEvents = {
  USER_REGISTERED: 'user.registered',
  USER_LOGGED_IN: 'user.logged_in',
  USER_UPDATED: 'user.updated',
  USER_DELETED: 'user.deleted',
  QUERY_CREATED: 'query.created',
  QUERY_ANALYZED: 'query.analyzed',
  JOB_STARTED: 'job.started',
  JOB_COMPLETED: 'job.completed',
  JOB_FAILED: 'job.failed',
  AUDIT_LOG: 'audit.log',
  MIGRATION_RUN: 'migration.run',
  TENANT_CREATED: 'tenant.created',
  TENANT_UPDATED: 'tenant.updated',
  SYSTEM_ERROR: 'system.error',
  HEALTH_CHECK_FAILED: 'health.check.failed',
} as const;

export function registerCoreEventHandlers(): void {
  eventBus.on(SystemEvents.USER_REGISTERED, async (data) => {
    logger.info(`User registered event: ${data.email}`);
  }, 10);

  eventBus.on(SystemEvents.QUERY_CREATED, async (data) => {
    logger.info(`Query created event: ${data.queryId}`);
  }, 5);

  eventBus.on(SystemEvents.SYSTEM_ERROR, async (data) => {
    logger.error(`System error event: ${data.message}`, { stack: data.stack });
  }, 100);

  eventBus.on(SystemEvents.AUDIT_LOG, async (data) => {
    logger.info(`Audit: ${data.action} by ${data.userId} on ${data.resource}`);
  }, 0);

  eventBus.on(SystemEvents.JOB_FAILED, async (data) => {
    logger.error(`Job failed event: ${data.jobName} - ${data.error}`);
  }, 50);
}

// Updated on 2026-03-14 13:22:05
