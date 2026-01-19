import { logger } from '../../config/logger';

export type EventHandler<T = any> = (data: T, metadata: EventMetadata) => void | Promise<void>;

export interface EventMetadata {
  eventId: string;
  eventName: string;
  timestamp: Date;
  source: string;
  correlationId?: string;
  tenantId?: string;
}

export interface EventSubscription {
  eventName: string;
  handler: EventHandler;
  priority: number;
}

export class EventBus {
  private handlers = new Map<string, EventSubscription[]>();
  private static instance: EventBus;
  private history: Array<{ event: string; data: any; metadata: EventMetadata }> = [];
  private maxHistory = 1000;

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  on(eventName: string, handler: EventHandler, priority: number = 0): void {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, []);
    }
    this.handlers.get(eventName)!.push({ eventName, handler, priority });
    this.handlers.get(eventName)!.sort((a, b) => b.priority - a.priority);
  }

  off(eventName: string, handler: EventHandler): void {
    const subs = this.handlers.get(eventName);
    if (subs) {
      const filtered = subs.filter(s => s.handler !== handler);
      this.handlers.set(eventName, filtered);
    }
  }

  async emit(eventName: string, data: any, metadata?: Partial<EventMetadata>): Promise<void> {
    const subs = this.handlers.get(eventName);
    if (!subs || subs.length === 0) {
      logger.debug(`Event emitted with no handlers: ${eventName}`);
      return;
    }

    const eventMetadata: EventMetadata = {
      eventId: this.generateId(),
      eventName,
      timestamp: new Date(),
      source: metadata?.source || 'application',
      correlationId: metadata?.correlationId,
      tenantId: metadata?.tenantId,
    };

    this.history.push({ event: eventName, data, metadata: eventMetadata });
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    logger.debug(`Emitting event: ${eventName} (${subs.length} handlers)`);

    for (const sub of subs) {
      try {
        await sub.handler(data, eventMetadata);
      } catch (error: any) {
        logger.error(`Event handler error for ${eventName}: ${error.message}`);
      }
    }
  }

  async emitAsync(eventName: string, data: any, metadata?: Partial<EventMetadata>): Promise<void> {
    const subs = this.handlers.get(eventName);
    if (!subs) return;

    const eventMetadata: EventMetadata = {
      eventId: this.generateId(),
      eventName,
      timestamp: new Date(),
      source: metadata?.source || 'application',
      correlationId: metadata?.correlationId,
      tenantId: metadata?.tenantId,
    };

    await Promise.all(
      subs.map(sub =>
        sub.handler(data, eventMetadata).catch((error: any) => {
          logger.error(`Async event handler error for ${eventName}: ${error.message}`);
        })
      )
    );
  }

  once(eventName: string, handler: EventHandler): void {
    const wrapper: EventHandler = async (data, metadata) => {
      await handler(data, metadata);
      this.off(eventName, wrapper);
    };
    this.on(eventName, wrapper);
  }

  clear(): void {
    this.handlers.clear();
  }

  getEventHistory(): Array<{ event: string; data: any; metadata: EventMetadata }> {
    return [...this.history];
  }

  getHandlerCount(eventName: string): number {
    return this.handlers.get(eventName)?.length || 0;
  }

  private generateId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const eventBus = EventBus.getInstance();

// Updated on 2026-01-19 18:26:16
