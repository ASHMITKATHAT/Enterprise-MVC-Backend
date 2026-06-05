import { Request, Response, NextFunction } from 'express';
import * as queryService from '../services/queryService';
import { CreateQueryInput } from '../validators/queryValidator';
import { logger } from '../config/logger'; // Assuming logger is auto-injected
import { errorHandler } from '../middlewares/errorHandler'; // Assuming errorHandler is auto-injected

export const analyzeData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = req.body as CreateQueryInput; // Cast req.body explicitly
    logger.debug(`Received analyze data request: ${JSON.stringify(payload)}`);

    const insights = await queryService.analyzeQuery(payload.query, payload.context);

    res.status(200).json({
      success: true,
      query: insights.query,
      insights: insights.insights
    });
  } catch (error) {
    logger.error(`Error in analyzeData controller: ${error}`);
    next(errorHandler(error, req, res, next)); // Pass error to errorHandler
  }
};

export const getHealth = (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.debug('Received health check request.');
    const status = queryService.getHealthStatus();
    res.status(200).json(status);
  } catch (error) {
    logger.error(`Error in getHealth controller: ${error}`);
    next(errorHandler(error, req, res, next)); // Pass error to errorHandler
  }
};
