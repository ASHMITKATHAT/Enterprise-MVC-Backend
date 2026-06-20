import { z } from 'zod';

export const createUserSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters long.').max(30, 'Username cannot exceed 30 characters.'),
  email: z.string().email('Invalid email address.'),
  pwd: z.string().min(8, 'Password must be at least 8 characters long.').max(50, 'Password cannot exceed 50 characters.') // Renamed from password
});

export const loginUserSchema = z.object({
  email: z.string().email('Invalid email address.'),
  pwd: z.string().min(1, 'Password is required.') // Renamed from password
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type LoginUserInput = z.infer<typeof loginUserSchema>;
