import { Router } from 'express';
import * as userController from '../controllers/userController';
import { createUserSchema, loginUserSchema } from '../validators/userValidator';
import { validate } from '../middlewares/validation'; // Assuming validation middleware is auto-injected
import { authenticate, authorize } from '../middlewares/auth'; // Assuming auth middleware is auto-injected

const router = Router();

// Public routes for authentication
router.post('/register', validate(createUserSchema), userController.register);
router.post('/login', validate(loginUserSchema), userController.login);

// Protected route for user profile, requires authentication
router.get('/profile', authenticate, userController.getProfile);

// Example of an Admin-only route
// router.get('/admin-dashboard', authenticate, authorize(['Admin']), userController.getAdminDashboard);

export default router;
