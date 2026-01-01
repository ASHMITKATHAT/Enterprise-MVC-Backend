import { logger } from '../../config/logger';
import { eventBus } from '../events/eventBus';
import { SystemEvents } from '../events/eventHandlers';

export type JobStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface Job<T = any> {
  id: string;
  name: string;
  data: T;
  status: JobStatus;
  priority: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  retries: number;
  maxRetries: number;
}

export interface JobHandler<T = any> {
  (job: Job<T>): Promise<void>;
}

export class JobQueue {
  private queue: Job[] = [];
  private handlers = new Map<string, JobHandler>();
  private running = false;
  private concurrency: number;
  private activeCount = 0;
  private timer: NodeJS.Timeout | null = null;
  private static instance: JobQueue;

  static getInstance(): JobQueue {
    if (!JobQueue.instance) {
      JobQueue.instance = new JobQueue(5);
    }
    return JobQueue.instance;
  }

  constructor(concurrency: number = 5) {
    this.concurrency = concurrency;
  }

  registerHandler(jobName: string, handler: JobHandler): void {
    this.handlers.set(jobName, handler);
  }

  async addJob<T>(name: string, data: T, options?: { priority?: number; maxRetries?: number }): Promise<string> {
    const job: Job = {
      id: this.generateId(),
      name,
      data,
      status: 'pending',
      priority: options?.priority || 0,
      createdAt: new Date(),
      retries: 0,
      maxRetries: options?.maxRetries || 3,
    };

    this.queue.push(job);
    this.queue.sort((a, b) => b.priority - a.priority);

    await eventBus.emit(SystemEvents.JOB_STARTED, { jobId: job.id, jobName: name });

    this.processNext();
    return job.id;
  }

  async addBulk<T>(jobs: Array<{ name: string; data: T; options?: { priority?: number; maxRetries?: number } }>): Promise<string[]> {
    const ids: string[] = [];
    for (const job of jobs) {
      const id = await this.addJob(job.name, job.data, job.options);
      ids.push(id);
    }
    return ids;
  }

  private async processNext(): Promise<void> {
    if (this.running) return;
    if (this.activeCount >= this.concurrency) return;

    const job = this.queue.find(j => j.status === 'pending');
    if (!job) return;

    this.running = true;
    this.activeCount++;

    job.status = 'running';
    job.startedAt = new Date();

    const handler = this.handlers.get(job.name);
    if (!handler) {
      job.status = 'failed';
      job.error = `No handler registered for job type: ${job.name}`;
      logger.error(job.error);
      await eventBus.emit(SystemEvents.JOB_FAILED, { jobId: job.id, jobName: job.name, error: job.error });
      this.activeCount--;
      this.running = false;
      this.processNext();
      return;
    }

    try {
      await handler(job);
      job.status = 'completed';
      job.completedAt = new Date();
      await eventBus.emit(SystemEvents.JOB_COMPLETED, { jobId: job.id, jobName: job.name });
      logger.info(`Job completed: ${job.name} (${job.id})`);
    } catch (error: any) {
      job.retries++;
      if (job.retries < job.maxRetries) {
        job.status = 'pending';
        job.error = error.message;
        logger.warn(`Job retrying: ${job.name} (attempt ${job.retries}/${job.maxRetries})`);
      } else {
        job.status = 'failed';
        job.error = error.message;
        job.completedAt = new Date();
        await eventBus.emit(SystemEvents.JOB_FAILED, { jobId: job.id, jobName: job.name, error: error.message });
        logger.error(`Job failed: ${job.name} - ${error.message}`);
      }
    }

    this.activeCount--;
    this.running = false;
    this.processNext();
  }

  getJob(jobId: string): Job | undefined {
    return this.queue.find(j => j.id === jobId);
  }

  getQueueStatus(): { pending: number; running: number; completed: number; failed: number; total: number } {
    const pending = this.queue.filter(j => j.status === 'pending').length;
    const running = this.queue.filter(j => j.status === 'running').length;
    const completed = this.queue.filter(j => j.status === 'completed').length;
    const failed = this.queue.filter(j => j.status === 'failed').length;
    return { pending, running, completed, failed, total: this.queue.length };
  }

  clear(): void {
    this.queue = [];
  }

  private generateId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const jobQueue = JobQueue.getInstance();
