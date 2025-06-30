/**
 * Validation System Demo - Zod Schemas with Runtime and Compile-time Safety
 *
 * This file demonstrates the complete validation system using Zod schemas
 * for both runtime validation and TypeScript type inference.
 */

import { z } from 'zod';
import { apiClient } from '../client/api-client';
import {
  apiResponseSchema,
  formatValidationErrors,
  validateQuery,
} from '../validation/base';
import {
  userQuerySchema,
  userResponseSchema,
  type UserApiResponse,
  type UserQuery,
  type UserResponse,
} from '../validation/users';
import {
  postQuerySchema,
  type PostApiResponse,
  type PostQuery,
  type PostResponse,
} from '../validation/posts';

// ===============================
// 1. RUNTIME VALIDATION EXAMPLES
// ===============================

/**
 * Example: Valid query that passes runtime validation
 */
export async function validQueryExample() {
  console.log('=== Valid Query Example ===');

  const validQuery: UserQuery = {
    page: 1,
    limit: 10,
    emailContains: '@example.com',
    hasPublishedPosts: 'true',
    includeTotalCount: true,
    orderBy: 'createdAt',
    orderDir: 'desc',
  };

  // This will pass both compile-time and runtime validation
  try {
    const result = await apiClient.getUsers(validQuery);
    console.log('✅ Valid query executed successfully:', result.pagination);
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

/**
 * Example: Invalid query that fails runtime validation
 */
export async function invalidQueryExample() {
  console.log('=== Invalid Query Example ===');

  const invalidQuery = {
    page: -1, // ❌ Invalid: must be >= 1
    limit: 200, // ❌ Invalid: max is 100
    email: 'not-an-email', // ❌ Invalid: not an email format
    createdAfter: 'invalid-date', // ❌ Invalid: not ISO date
    hasPublishedPosts: 'maybe', // ❌ Invalid: must be 'true' or 'false'
  };

  try {
    // Runtime validation will catch these errors
    await apiClient.getUsers(invalidQuery as any);
  } catch (error) {
    console.log('✅ Runtime validation caught errors:', error);
  }
}

/**
 * Example: Server-side validation using validateQuery
 */
export function serverSideValidationExample() {
  console.log('=== Server-side Validation Example ===');

  // Simulate URL search params
  const searchParams = new URLSearchParams({
    page: '1',
    limit: '10',
    emailContains: '@test.com',
    hasPublishedPosts: 'true',
  });

  // Validate using our validation helper
  const validation = validateQuery(userQuerySchema, searchParams);

  if (validation.success) {
    console.log('✅ Query validation passed:', validation.data);
    // validation.data is now typed as UserQuery
    return validation.data;
  } else {
    console.log('❌ Query validation failed:');
    const errors = formatValidationErrors(validation.errors);
    errors.forEach((error) => {
      console.log(`  - ${error.field}: ${error.message}`);
    });
  }
}

// ===============================
// 2. COMPILE-TIME TYPE SAFETY
// ===============================

/**
 * Example: TypeScript will catch type errors at compile time
 */
export function compileTimeTypeExample() {
  console.log('=== Compile-time Type Safety Example ===');

  // ✅ Valid: TypeScript knows these are the correct types
  const validUserQuery: Partial<UserQuery> = {
    page: 1,
    limit: 20,
    emailContains: 'test',
    hasPublishedPosts: 'true',
  };

  const validPostQuery: Partial<PostQuery> = {
    page: 1,
    limit: 15,
    published: 'true',
    titleContains: 'tutorial',
  };

  // ❌ These would cause TypeScript compilation errors:

  // const invalidUserQuery: UserQuery = {
  //   page: "one",           // Type error: string not assignable to number
  //   limit: true,           // Type error: boolean not assignable to number
  //   nonExistentField: 123  // Type error: doesn't exist on UserQuery
  // }

  // const invalidPostQuery: PostQuery = {
  //   published: "maybe",    // Type error: "maybe" not assignable to "true" | "false"
  //   authorAge: 25          // Type error: doesn't exist on PostQuery
  // }

  console.log('✅ All types are valid at compile time');
}

// ===============================
// 3. RESPONSE VALIDATION
// ===============================

/**
 * Example: Validating API responses with Zod schemas
 */
export async function responseValidationExample() {
  console.log('=== Response Validation Example ===');

  try {
    const response = await apiClient.getUsers({ limit: 5 });

    // Validate the entire API response structure
    const apiSchema = apiResponseSchema(userResponseSchema);
    const validation = apiSchema.safeParse(response);

    if (validation.success) {
      console.log('✅ Response structure is valid');
      // validation.data is now typed as UserApiResponse

      // Validate individual user objects
      validation.data.data.forEach((user, index) => {
        const userValidation = userResponseSchema.safeParse(user);
        if (userValidation.success) {
          console.log(`✅ User ${index + 1} is valid:`, user.email);
        } else {
          console.log(`❌ User ${index + 1} validation failed`);
        }
      });
    } else {
      console.log('❌ Response structure validation failed');
    }
  } catch (error) {
    console.error('API call failed:', error);
  }
}

// ===============================
// 4. SCHEMA TRANSFORMATION
// ===============================

/**
 * Example: Using Zod transformations for data processing
 */
export function schemaTransformationExample() {
  console.log('=== Schema Transformation Example ===');

  // The userQuerySchema already includes transformations:
  // - includeTotalCount: string "true"/"false" -> boolean
  // - page/limit: string -> number (with coerce)

  const rawParams = {
    page: '2', // String from URL
    limit: '25', // String from URL
    includeTotalCount: 'true', // String from URL
  };

  const validation = userQuerySchema.safeParse(rawParams);

  if (validation.success) {
    console.log('✅ Transformed data:', validation.data);
    // validation.data.page is now number 2
    // validation.data.limit is now number 25
    // validation.data.includeTotalCount is now boolean true
  }
}

// ===============================
// 5. CONDITIONAL VALIDATION
// ===============================

/**
 * Example: Conditional validation based on query parameters
 */
export async function conditionalValidationExample() {
  console.log('=== Conditional Validation Example ===');

  // Different validation rules can be applied based on context

  // For admin users, allow higher limits
  const adminQuerySchema = userQuerySchema.extend({
    limit: userQuerySchema.shape.limit.pipe(z.number().max(1000)), // Override limit for admins
  });

  const adminQuery = {
    page: 1,
    limit: 500, // Would fail normal validation but passes admin validation
    emailContains: '@admin.com',
  };

  const normalValidation = userQuerySchema.safeParse(adminQuery);
  const adminValidation = adminQuerySchema.safeParse(adminQuery);

  console.log('Normal validation result:', normalValidation.success); // false
  console.log('Admin validation result:', adminValidation.success); // true
}

// ===============================
// 6. GENERIC VALIDATION PATTERNS
// ===============================

/**
 * Example: Generic validation for any model
 */
export function genericValidationPattern<T extends Record<string, any>>(
  schema: T,
  data: any
): { success: true; data: T } | { success: false; errors: string[] } {
  // This pattern can be used for any Zod schema
  const validation = schema.safeParse(data);

  if (validation.success) {
    return { success: true, data: validation.data };
  } else {
    return {
      success: false,
      errors: validation.error.errors.map(
        (err: any) => `${err.path.join('.')}: ${err.message}`
      ),
    };
  }
}

// ===============================
// 7. TYPE GUARDS AND UTILITIES
// ===============================

/**
 * Type guards for safe type checking
 */
export function isValidUserQuery(data: any): data is UserQuery {
  return userQuerySchema.safeParse(data).success;
}

export function isValidPostQuery(data: any): data is PostQuery {
  return postQuerySchema.safeParse(data).success;
}

export function isValidUserResponse(data: any): data is UserResponse {
  return userResponseSchema.safeParse(data).success;
}

/**
 * Utility to safely extract validated query parameters
 */
export function extractValidatedParams<T>(
  schema: any,
  searchParams: URLSearchParams
): T | null {
  const validation = validateQuery(schema, searchParams);
  return validation.success ? validation.data : null;
}

// ===============================
// 8. DEMO RUNNER
// ===============================

/**
 * Run all validation examples
 */
export async function runValidationDemo() {
  console.log('🚀 Starting Validation System Demo\n');

  try {
    await validQueryExample();
    console.log();

    await invalidQueryExample();
    console.log();

    serverSideValidationExample();
    console.log();

    compileTimeTypeExample();
    console.log();

    await responseValidationExample();
    console.log();

    schemaTransformationExample();
    console.log();

    await conditionalValidationExample();
    console.log();

    console.log('✅ Validation Demo completed successfully!');
  } catch (error) {
    console.error('❌ Demo failed:', error);
  }
}

// Export types for external use
export type {
  PostApiResponse,
  PostQuery,
  PostResponse,
  UserApiResponse,
  UserQuery,
  UserResponse,
};
