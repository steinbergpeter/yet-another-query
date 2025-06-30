import { z } from 'zod';
import { baseQuerySchema, apiResponseSchema } from './base';

// Post-specific query schema
export const postQuerySchema = baseQuerySchema.extend({
  // String field filters
  title: z.string().optional(),
  content: z.string().optional(),
  titleContains: z.string().optional(),
  contentContains: z.string().optional(),

  // Boolean filters
  published: z.enum(['true', 'false']).optional(),

  // Date filters
  createdAfter: z.string().datetime().optional(),
  createdBefore: z.string().datetime().optional(),
  updatedAfter: z.string().datetime().optional(),
  updatedBefore: z.string().datetime().optional(),

  // Relation filters
  hasAuthor: z.enum(['true', 'false']).optional(),
  authorNameContains: z.string().optional(),
  authorEmailContains: z.string().optional(),
  authorEmail: z.string().email().optional(),

  // Custom filters
  publishedOnly: z.enum(['true', 'false']).optional(),
});

// Post response schema
export const postResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string().nullable(),
  published: z.boolean(),
  authorId: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  excerpt: z.string().nullable().optional(), // Computed field
  wordCount: z.number().optional(), // Computed field
  author: z.any().optional(), // Dynamic based on include
});

// Type exports for TypeScript inference
export type PostQuery = z.infer<typeof postQuerySchema>;
export type PostResponse = z.infer<typeof postResponseSchema>;

// Post API Response type
export type PostApiResponse = z.infer<
  ReturnType<typeof apiResponseSchema<typeof postResponseSchema>>
>;
