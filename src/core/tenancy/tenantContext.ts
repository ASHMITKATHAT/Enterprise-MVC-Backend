import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { logger } from '../../config/logger';

export interface Tenant {
  id: string;
  name: string;
  domain?: string;
  database?: string;
  settings?: Record<string, any>;
  isActive: boolean;
}

export class TenantContext {
  private static current: Tenant | null = null;
  private static tenants = new Map<string, Tenant>();

  static setTenant(tenant: Tenant): void {
    TenantContext.current = tenant;
  }

  static getTenant(): Tenant | null {
    return TenantContext.current;
  }

  static getTenantId(): string | null {
    return TenantContext.current?.id || null;
  }

  static clear(): void {
    TenantContext.current = null;
  }

  static registerTenant(tenant: Tenant): void {
    TenantContext.tenants.set(tenant.id, tenant);
    if (tenant.domain) {
      TenantContext.tenants.set(tenant.domain, tenant);
    }
  }

  static getTenantById(id: string): Tenant | undefined {
    return TenantContext.tenants.get(id);
  }

  static getAllTenants(): Tenant[] {
    return Array.from(TenantContext.tenants.values())
      .filter((t, i, arr) => arr.findIndex(x => x.id === t.id) === i);
  }

  static async initializeTenants(): Promise<void> {
    try {
      const db = mongoose.connection.db;
      if (!db) return;
      const collection = db.collection('_tenants');
      const tenants = await collection.find({ isActive: true }).toArray();
      for (const t of tenants) {
        TenantContext.registerTenant(t as unknown as Tenant);
      }
      logger.info(`Loaded ${tenants.length} active tenants`);
    } catch (error: any) {
      logger.warn(`Could not load tenants from database: ${error.message}`);
    }
  }
}

export function tenantMiddleware(req: Request, res: Response, next: NextFunction): void {
  const tenantId = req.headers['x-tenant-id'] as string || req.query.tenant as string;

  if (tenantId) {
    const tenant = TenantContext.getTenantById(tenantId);
    if (tenant) {
      if (!tenant.isActive) {
        return res.status(403).json({ message: 'Tenant is inactive' });
      }
      TenantContext.setTenant(tenant);
      (req as any).tenant = tenant;
    } else {
      logger.warn(`Unknown tenant: ${tenantId}`);
    }
  }

  res.on('finish', () => {
    TenantContext.clear();
  });

  next();
}

export function requireTenant(req: Request, res: Response, next: NextFunction): void {
  if (!TenantContext.getTenant()) {
    return res.status(400).json({ message: 'Tenant context required. Provide x-tenant-id header or tenant query parameter.' });
  }
  next();
}

// Updated on 2026-05-08 10:24:21
