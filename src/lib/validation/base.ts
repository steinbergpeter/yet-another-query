import { z } from 'zod';

// Base validation schemas
export const idSchema = z.string().min(1);
export const emailSchema = z.string().email();
export const urlSearchParamsSchema = z.string().optional();

// Pagination schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  skip: z.coerce.number().int().min(0).optional(),
  take: z.coerce.number().int().min(1).max(100).optional(),
  cursor: z.string().optional(),
  includeTotalCount: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .default('false'),
});

// Order direction schema
export const orderDirectionSchema = z.enum(['asc', 'desc']).default('asc');

// Select/Include schemas
export const selectSchema = z.string().optional();
export const includeSchema = z.string().optional();

// Distinct schema
export const distinctSchema = z.string().optional();

// Base query parameters that all models share
export const baseQuerySchema = z.object({
  // Selection
  select: selectSchema,
  include: includeSchema,
  distinct: distinctSchema,

  // Pagination
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  skip: z.coerce.number().int().min(0).optional(),
  take: z.coerce.number().int().min(1).max(100).optional(),
  cursor: z.string().optional(),
  includeTotalCount: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .default('false'),

  // Ordering
  orderBy: z.string().optional(),
  orderDir: z.string().optional(),

  // Complex conditions (JSON strings)
  and: z.string().optional(),
  or: z.string().optional(),
});

// Response schemas
export const paginationResponseSchema = z.object({
  page: z.number(),
  limit: z.number(),
  skip: z.number(),
  take: z.number(),
  totalCount: z.number().optional(),
  totalPages: z.number().optional(),
});

export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: z.array(dataSchema),
    pagination: paginationResponseSchema,
  });

// Error response schema
export const errorResponseSchema = z.object({
  error: z.string(),
  details: z.string().optional(),
  validation: z
    .array(
      z.object({
        field: z.string(),
        message: z.string(),
      })
    )
    .optional(),
});

// Type exports for TypeScript inference
export type BaseQuery = z.infer<typeof baseQuerySchema>;
export type PaginationResponse = z.infer<typeof paginationResponseSchema>;
export type ErrorResponse = z.infer<typeof errorResponseSchema>;

// Generic query schema factory
export function createQuerySchema<T extends Record<string, z.ZodTypeAny>>(
  modelSpecificFields: T
) {
  return baseQuerySchema.extend(modelSpecificFields);
}

// Validation helper functions
export function validateQuery<T extends z.ZodSchema>(
  schema: T,
  searchParams: URLSearchParams
):
  | { success: true; data: z.infer<T> }
  | { success: false; errors: z.ZodError } {
  try {
    // Convert URLSearchParams to object
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });

    const result = schema.safeParse(params);

    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, errors: result.error };
    }
  } catch (error) {
    throw new Error(`Validation failed: ${error}`);
  }
}

// Validation error formatter
export function formatValidationErrors(error: z.ZodError) {
  return error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));
}
