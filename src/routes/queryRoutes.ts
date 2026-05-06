import { Router } from 'express';
import * as queryController from '../controllers/queryController';
import { createQuerySchema } from '../validators/queryValidator';
import { validate } from '../middlewares/validation'; // Assuming validation middleware is auto-injected
import { authenticate } from '../middlewares/auth'; // Assuming auth middleware is auto-injected

const router = Router();

// Public route for health check
router.get('/status', queryController.getHealth);

// Protected route for analysis, requires authentication and validation
router.post('/analyze', authenticate, validate(createQuerySchema), queryController.analyzeData);

export default router;

// Updated on 2026-05-06 12:53:26
