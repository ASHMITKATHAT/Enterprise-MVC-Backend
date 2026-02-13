import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../config/logger'; // Assuming logger is auto-injected

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: 'Admin' | 'User';
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('Authentication failed: No token provided or invalid format.');
    return res.status(401).json({ message: 'Authentication failed: No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: 'Admin' | 'User' };
    req.user = decoded;
    next();
  } catch (error: any) {
    logger.warn(`Authentication failed: Invalid token. Error: ${error.message}`);
    return res.status(401).json({ message: 'Authentication failed: Invalid token.' });
  }
};

export const authorize = (roles: Array<'Admin' | 'User'>) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      logger.error('Authorization failed: User not authenticated (missing req.user).');
      return res.status(403).json({ message: 'Authorization failed: User not authenticated.' });
    }
    if (!roles.includes(req.user.role)) {
      logger.warn(`Authorization failed for user ${req.user.id} with role ${req.user.role}. Required roles: ${roles.join(', ')}`);
      return res.status(403).json({ message: 'Authorization failed: Insufficient permissions.' });
    }
    next();
  };
};

// Updated on 2026-02-13 17:57:46
