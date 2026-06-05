import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../config/logger';

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): void {
  if (err instanceof ZodError) {
    logger.warn(`Validation error for request to ${req.path}: ${err.errors.map(e => e.message).join(', ')}`);
    res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: err.errors.map(e => ({ path: e.path.join('.'), message: e.message })),
    });
  } else if ((err as any).name === 'CastError') {
    logger.warn(`Cast error for request to ${req.path}: ${err.message}`);
    res.status(400).json({ success: false, message: 'Invalid ID format' });
  } else if ((err as any).code === 11000) {
    logger.warn(`Duplicate key error for request to ${req.path}: ${err.message}`);
    res.status(409).json({ success: false, message: 'Duplicate entry', details: err.message });
  } else {
    logger.error(`Unhandled error for request to ${req.path}: ${err.message}`, { stack: err.stack });
    res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
  }
}