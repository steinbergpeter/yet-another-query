# Validation System Documentation

This project implements a comprehensive validation system using [Zod](https://zod.dev/) for both runtime validation and TypeScript type inference.

## Overview

The validation system provides:

- **Runtime Validation**: Query parameters are validated at runtime using Zod schemas
- **Compile-time Type Safety**: TypeScript types are automatically inferred from Zod schemas
- **Error Handling**: Comprehensive error messages for validation failures
- **Schema Transformations**: Automatic type coercion (e.g., strings to numbers)
- **Model-specific Validation**: Custom validation rules for each Prisma model

## Key Files

```text
src/lib/
├── validation.ts       # Zod schemas and type definitions
├── api-handler.ts      # Generic API handler with validation
├── api-client.ts       # Type-safe API client
└── validation-demo.ts  # Comprehensive examples
```

## Basic Usage

### 1. Query Validation

```typescript
import { userQuerySchema, type UserQuery } from '@/lib/validation';

// Type-safe query (compile-time)
const query: Partial<UserQuery> = {
  page: 1,
  limit: 10,
  emailContains: '@example.com',
  hasPublishedPosts: 'true',
};

// Runtime validation
const validation = userQuerySchema.safeParse(query);
if (validation.success) {
  console.log('Valid query:', validation.data);
} else {
  console.log('Invalid query:', validation.error);
}
```

### 2. API Client Usage

```typescript
import { userAPI } from '@/lib/api-client';

// Both compile-time and runtime validation
const users = await userAPI.getAll({
  page: 1,
  limit: 20,
  emailContains: '@company.com',
  includeTotalCount: true,
});
```

### 3. Server-side Validation

```typescript
// In API routes
export const GET = createGenericHandler({
  modelName: 'user',
  config: userConfig,
  querySchema: userQuerySchema, // Automatic validation
  customFilters: customUserFilters,
});
```

## Schema Structure

### Base Query Schema

All models inherit from `baseQuerySchema`:

```typescript
const baseQuerySchema = z.object({
  // Selection
  select: z.string().optional(),
  include: z.string().optional(),
  distinct: z.string().optional(),

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

  // Complex conditions
  and: z.string().optional(),
  or: z.string().optional(),
});
```

### Model-specific Extensions

Each model extends the base schema with model-specific fields:

```typescript
// Users
const userQuerySchema = baseQuerySchema.extend({
  email: z.string().optional(),
  name: z.string().optional(),
  emailContains: z.string().optional(),
  hasPublishedPosts: z.enum(['true', 'false']).optional(),
  // ... more fields
});

// Posts
const postQuerySchema = baseQuerySchema.extend({
  title: z.string().optional(),
  content: z.string().optional(),
  published: z.enum(['true', 'false']).optional(),
  authorEmail: z.string().email().optional(),
  // ... more fields
});
```

## Type Inference

TypeScript types are automatically inferred from Zod schemas:

```typescript
type UserQuery = z.infer<typeof userQuerySchema>;
type PostQuery = z.infer<typeof postQuerySchema>;
type UserResponse = z.infer<typeof userResponseSchema>;
type PostResponse = z.infer<typeof postResponseSchema>;
```

## Validation Features

### 1. Type Coercion

Automatic conversion of string parameters (from URLs) to appropriate types:

```typescript
// URL: /api/users?page=2&limit=25&includeTotalCount=true
// Results in:
{
  page: 2,        // number
  limit: 25,      // number
  includeTotalCount: true  // boolean
}
```

### 2. Validation Rules

- **Email validation**: Ensures valid email format
- **Number constraints**: Min/max values for pagination
- **Enum validation**: Specific allowed values (e.g., 'true'/'false')
- **Date validation**: ISO datetime format
- **Custom business rules**: Model-specific logic

### 3. Error Handling

Comprehensive error messages with field-specific details:

```typescript
{
  "error": "Invalid query parameters",
  "validation": [
    {
      "field": "page",
      "message": "Number must be greater than or equal to 1"
    },
    {
      "field": "email",
      "message": "Invalid email"
    }
  ]
}
```

## Advanced Usage

### Custom Validation Schemas

Create model-specific validation schemas:

```typescript
const customUserSchema = baseQuerySchema.extend({
  department: z.enum(['engineering', 'marketing', 'sales']),
  isActive: z.enum(['true', 'false']).transform((val) => val === 'true'),
  joinedAfter: z.string().datetime(),
});
```

### Conditional Validation

Different validation rules based on context:

```typescript
const adminQuerySchema = userQuerySchema.extend({
  limit: z.coerce.number().int().min(1).max(1000), // Higher limit for admins
});
```

### Response Validation

Validate API responses to ensure data integrity:

```typescript
const validation = userResponseSchema.safeParse(userData);
if (validation.success) {
  // Safe to use validation.data
} else {
  // Handle invalid response
}
```

## Testing

Run the validation demo to see all features in action:

```bash
npm run test:validation
```

Or use the demo functions directly:

```typescript
import { runValidationDemo } from '@/lib/validation-demo';

await runValidationDemo();
```

## Benefits

1. **Type Safety**: Catch errors at compile time with TypeScript
2. **Runtime Safety**: Validate data at runtime to prevent errors
3. **DRY Principle**: Single source of truth for validation rules
4. **Developer Experience**: IntelliSense and autocomplete
5. **Error Clarity**: Detailed validation error messages
6. **Maintainability**: Easy to update validation rules
7. **Performance**: Efficient validation with early returns

## Error Examples

### Compile-time Errors

```typescript
const invalidQuery: UserQuery = {
  page: 'one', // ❌ Type error: string not assignable to number
  limit: true, // ❌ Type error: boolean not assignable to number
  invalidField: 123, // ❌ Type error: property doesn't exist
};
```

### Runtime Errors

```typescript
const result = await userAPI.getAll({
  page: -1, // ❌ Runtime error: must be >= 1
  limit: 200, // ❌ Runtime error: max is 100
  email: 'invalid', // ❌ Runtime error: invalid email format
});
// Throws: "Invalid parameters: Number must be greater than or equal to 1"
```

This validation system ensures both type safety and runtime correctness, providing a robust foundation for API interactions.
