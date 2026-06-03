import mongoose from 'mongoose';
import { logger } from './logger'; // Assuming logger is auto-injected

export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/software_project_db';
    await mongoose.connect(mongoUri);
    logger.info('MongoDB connected successfully.');
  } catch (error: any) {
    logger.error(`MongoDB connection error: ${error.message}`);
    process.exit(1); // Exit process with failure
  }
};

// Updated on 2026-01-17 14:36:32

// Updated on 2026-03-29 08:10:44

// Updated on 2026-06-03 17:48:29
