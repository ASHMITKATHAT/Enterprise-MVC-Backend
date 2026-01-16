import 'dotenv/config'; // Load environment variables first
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { connectDB } from './config/db';
import { logger } from './config/logger'; // Assuming logger is auto-injected
import { errorHandler } from './middlewares/errorHandler'; // Assuming errorHandler is auto-injected

// Import routes
import queryRoutes from './routes/queryRoutes';
import userRoutes from './routes/userRoutes';

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Security Middlewares
app.use(helmet());
app.use(cors()); // Enable CORS for all origins (can be configured for specific origins)

// Rate limiting to prevent brute-force attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use(limiter);

// Body parser
app.use(express.json());

// API Routes
app.use('/api', queryRoutes);
app.use('/api/auth', userRoutes); // Group user auth routes under /api/auth

// Health check endpoint (can be moved to queryRoutes if preferred)
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Welcome to the TypeScript Enterprise MVC Backend!' });
});

// Global Error Handler (MUST be last middleware)
app.use(errorHandler);

// Start the server
if (process.env.NODE_ENV !== 'test') { // Don't listen in test environment
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });
}

export default app; // Export app for testing

// Updated on 2026-01-03 17:23:14

// Updated on 2026-01-16 12:12:56
