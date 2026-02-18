import mongoose from 'mongoose';
import { logger } from '../../config/logger';
import { eventBus } from '../events/eventBus';
import { SystemEvents } from '../events/eventHandlers';

export interface AuditEntry {
  id?: string;
  timestamp: Date;
  action: string;
  actorId: string;
  actorType: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ip?: string;
  userAgent?: string;
  tenantId?: string;
  correlationId?: string;
  outcome: 'success' | 'failure';
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class AuditLogger {
  private collectionName = '_audit_logs';
  private enabled = true;
  private static instance: AuditLogger;

  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  async log(entry: Omit<AuditEntry, 'id' | 'timestamp'>): Promise<void> {
    if (!this.enabled) return;

    const fullEntry: AuditEntry = {
      ...entry,
      timestamp: new Date(),
    };

    try {
      const collection = mongoose.connection.collection(this.collectionName);
      await collection.insertOne(fullEntry);

      eventBus.emit(SystemEvents.AUDIT_LOG, fullEntry);
      logger.debug(`Audit log: ${entry.action} on ${entry.resource} by ${entry.actorId}`);
    } catch (error: any) {
      logger.error(`Failed to write audit log: ${error.message}`);
    }
  }

  async query(filters: Partial<AuditEntry> & { from?: Date; to?: Date }): Promise<AuditEntry[]> {
    const query: any = {};
    if (filters.action) query.action = filters.action;
    if (filters.actorId) query.actorId = filters.actorId;
    if (filters.resource) query.resource = filters.resource;
    if (filters.tenantId) query.tenantId = filters.tenantId;
    if (filters.outcome) query.outcome = filters.outcome;
    if (filters.severity) query.severity = filters.severity;
    if (filters.from || filters.to) {
      query.timestamp = {};
      if (filters.from) query.timestamp.$gte = filters.from;
      if (filters.to) query.timestamp.$lte = filters.to;
    }

    try {
      const collection = mongoose.connection.collection(this.collectionName);
      return await collection.find(query).sort({ timestamp: -1 }).limit(100).toArray() as unknown as AuditEntry[];
    } catch (error: any) {
      logger.error(`Failed to query audit logs: ${error.message}`);
      return [];
    }
  }

  async getStats(): Promise<{ total: number; byAction: Record<string, number>; bySeverity: Record<string, number> }> {
    try {
      const collection = mongoose.connection.collection(this.collectionName);
      const total = await collection.countDocuments();
      const actions = await collection.aggregate([
        { $group: { _id: '$action', count: { $sum: 1 } } }
      ]).toArray();
      const severities = await collection.aggregate([
        { $group: { _id: '$severity', count: { $sum: 1 } } }
      ]).toArray();

      const byAction: Record<string, number> = {};
      const bySeverity: Record<string, number> = {};

      for (const a of actions) byAction[a._id] = a.count;
      for (const s of severities) bySeverity[s._id] = s.count;

      return { total, byAction, bySeverity };
    } catch {
      return { total: 0, byAction: {}, bySeverity: {} };
    }
  }
}

export const auditLogger = AuditLogger.getInstance();

// Updated on 2026-02-16 19:41:56

// Updated on 2026-02-18 14:32:11
