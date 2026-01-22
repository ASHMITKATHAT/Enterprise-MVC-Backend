import { QueryModel, IQuery, IInsight } from '../models/QueryModel';
import { logger } from '../config/logger'; // Assuming logger is auto-injected

// Helper: generate model insights (simulated)
const computeAiInsights = (q: string, c: string): IInsight => {
  const scores = Array.from({ length: 3 }, () => Math.random() * (0.99 - 0.7) + 0.7);
  return {
    confidence: scores.reduce((sum, score) => sum + score, 0) / 3,
    recommendation: `Ensure system checks address query keyword: ${q}. Context provided: ${c.substring(0, 50)}...`,
    status: 'COMPLETED'
  };
};

export const analyzeQuery = async (queryText: string, contextText: string): Promise<IQuery> => {
  logger.info(`Analyzing query: "${queryText}" with context: "${contextText}"`);
  try {
    const insights = computeAiInsights(queryText, contextText);

    const newQuery = new QueryModel({
      query: queryText,
      context: contextText,
      insights: insights
    });

    await newQuery.save();
    logger.info(`Query analysis saved for query ID: ${newQuery._id}`);
    return newQuery;
  } catch (error: any) {
    logger.error(`Error analyzing query: ${error.message}`);
    throw new Error('Failed to analyze query.');
  }
};

export const getHealthStatus = () => {
  logger.info('Checking health status.');
  return { healthy: true, engine: 'TypeScript Express AI Vector-Proxy' };
};

// Updated on 2026-01-15 18:38:19

// Updated on 2026-01-22 18:00:21
