import { z } from 'zod';
import { baseQuerySchema, apiResponseSchema } from './base';

// User-specific query schema
export const userQuerySchema = baseQuerySchema.extend({
  // String field filters
  email: z.string().optional(),
  name: z.string().optional(),
  emailContains: z.string().optional(),
  emailStartsWith: z.string().optional(),
  emailEndsWith: z.string().optional(),
  nameContains: z.string().optional(),

  // Date filters
  createdAfter: z.string().datetime().optional(),
  createdBefore: z.string().datetime().optional(),
  updatedAfter: z.string().datetime().optional(),
  updatedBefore: z.string().datetime().optional(),

  // Relation filters
  hasPublishedPosts: z.enum(['true', 'false']).optional(),
  hasPosts: z.enum(['true', 'false']).optional(),
  postTitleContains: z.string().optional(),
});

// User response schema
export const userResponseSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  displayName: z.string().optional(), // Computed field
  posts: z.array(z.any()).optional(), // Dynamic based on include
  _count: z
    .object({
      posts: z.number(),
    })
    .optional(),
});

// Type exports for TypeScript inference
export type UserQuery = z.infer<typeof userQuerySchema>;
export type UserResponse = z.infer<typeof userResponseSchema>;

// User API Response type
export type UserApiResponse = z.infer<
  ReturnType<typeof apiResponseSchema<typeof userResponseSchema>>
>;
