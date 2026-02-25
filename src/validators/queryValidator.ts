import { z } from 'zod';

export const createQuerySchema = z.object({
  query: z.string().min(5, 'Query must be at least 5 characters long.').max(500, 'Query cannot exceed 500 characters.'),
  context: z.string().max(1000, 'Context cannot exceed 1000 characters.').optional().default('')
});

export type CreateQueryInput = z.infer<typeof createQuerySchema>;

// Updated on 2026-02-22 10:11:45

// Updated on 2026-02-23 11:10:22

// Updated on 2026-02-25 08:02:43
