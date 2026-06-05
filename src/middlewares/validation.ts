import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { logger } from '../config/logger'; // Assuming logger is auto-injected

export const validate = (schema: AnyZodObject) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error: any) {
      if (error instanceof ZodError) {
        logger.warn(`Validation error: ${error.errors.map(e => e.message).join(', ')}`);
        return res.status(400).json({
          message: 'Validation failed',
          errors: error.errors.map(e => ({ path: e.path.join('.'), message: e.message }))
        });
      }
      logger.error(`Unexpected validation error: ${error.message}`);
      next(error); // Pass other errors to the general error handler
    }
  };
