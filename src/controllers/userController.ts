import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/userService';
import { CreateUserInput, LoginUserInput } from '../validators/userValidator';
import { logger } from '../config/logger'; // Assuming logger is auto-injected
import { errorHandler } from '../middlewares/errorHandler'; // Assuming errorHandler is auto-injected

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: 'Admin' | 'User';
  };
}

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, email, pwd } = req.body as CreateUserInput; // Cast req.body explicitly
    logger.debug(`Registering user: ${email}`);
    const user = await userService.registerUser(username, email, pwd);
    res.status(201).json({ message: 'User registered successfully.', userId: user._id, email: user.email });
  } catch (error) {
    logger.error(`Error in register controller: ${error}`);
    next(errorHandler(error, req, res, next));
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, pwd } = req.body as LoginUserInput; // Cast req.body explicitly
    logger.debug(`Logging in user: ${email}`);
    const { token, user } = await userService.loginUser(email, pwd);
    res.status(200).json({ message: 'Logged in successfully.', token, userId: user._id, role: user.role });
  } catch (error) {
    logger.error(`Error in login controller: ${error}`);
    next(errorHandler(error, req, res, next));
  }
};

export const getProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) {
      logger.warn('Attempt to access profile without user ID in token.');
      return res.status(401).json({ message: 'Unauthorized: User ID missing from token.' });
    }
    logger.debug(`Fetching profile for user ID: ${req.user.id}`);
    const user = await userService.getUserProfile(req.user.id);
    if (!user) {
      logger.warn(`Profile not found for user ID: ${req.user.id}`);
      return res.status(404).json({ message: 'User profile not found.' });
    }
    res.status(200).json(user);
  } catch (error) {
    logger.error(`Error in getProfile controller: ${error}`);
    next(errorHandler(error, req, res, next));
  }
};
