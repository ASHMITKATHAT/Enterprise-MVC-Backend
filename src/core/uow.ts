import { ClientSession } from 'mongoose';
import { Connection } from 'mongoose';

export interface IUnitOfWork {
  start(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  getSession(): ClientSession | null;
  isActive(): boolean;
}

export class UnitOfWork implements IUnitOfWork {
  private session: ClientSession | null = null;
  private active = false;

  constructor(private connection: Connection) {}

  async start(): Promise<void> {
    if (this.active) throw new Error('Unit of work already active');
    this.session = await this.connection.startSession();
    this.session.startTransaction();
    this.active = true;
  }

  async commit(): Promise<void> {
    if (!this.active || !this.session) throw new Error('No active unit of work');
    await this.session.commitTransaction();
    this.active = false;
  }

  async rollback(): Promise<void> {
    if (!this.active || !this.session) throw new Error('No active unit of work');
    await this.session.abortTransaction();
    this.active = false;
  }

  getSession(): ClientSession | null {
    return this.session;
  }

  isActive(): boolean {
    return this.active;
  }

  async dispose(): Promise<void> {
    if (this.session) {
      await this.session.endSession();
      this.session = null;
    }
    this.active = false;
  }
}
