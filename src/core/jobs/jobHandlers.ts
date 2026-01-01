import { jobQueue } from './jobQueue';
import { logger } from '../../config/logger';

export function registerJobHandlers(): void {
  jobQueue.registerHandler('sendEmail', async (job) => {
    logger.info(`Sending email: ${JSON.stringify(job.data)}`);
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  jobQueue.registerHandler('processQuery', async (job) => {
    logger.info(`Processing query analysis: ${JSON.stringify(job.data)}`);
    await new Promise(resolve => setTimeout(resolve, 200));
  });

  jobQueue.registerHandler('generateReport', async (job) => {
    logger.info(`Generating report: ${JSON.stringify(job.data)}`);
    await new Promise(resolve => setTimeout(resolve, 500));
  });

  jobQueue.registerHandler('cleanupData', async (job) => {
    logger.info(`Cleaning up old data: ${JSON.stringify(job.data)}`);
    await new Promise(resolve => setTimeout(resolve, 300));
  });

  jobQueue.registerHandler('auditExport', async (job) => {
    logger.info(`Exporting audit logs: ${JSON.stringify(job.data)}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  });
}
