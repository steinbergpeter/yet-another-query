import { createGenericHandler } from '@/lib/server/api-handler';
import { userConfig } from '@/lib/server/model-configs';
import { userQuerySchema, type UserResponse } from '@/lib/validation/users';

// Custom filters specific to users with type safety
function customUserFilters(
  searchParams: URLSearchParams,
  whereConditions: any
) {
  // Handle custom user-specific logic
  const hasPublishedPosts = searchParams.get('hasPublishedPosts');
  const postTitleContains = searchParams.get('postTitleContains');

  if (hasPublishedPosts === 'true') {
    whereConditions.posts = { some: { published: true } };
  } else if (hasPublishedPosts === 'false') {
    whereConditions.posts = { none: { published: true } };
  }

  if (postTitleContains) {
    whereConditions.posts = {
      some: {
        title: { contains: postTitleContains, mode: 'insensitive' },
      },
    };
  }
}

// Create the handler using the generic system with validation
export const GET = createGenericHandler({
  modelName: 'user',
  config: userConfig,
  querySchema: userQuerySchema,
  customFilters: customUserFilters,
  // Optional: Transform results before sending with type safety
  afterQuery: (users): UserResponse[] => {
    // You could add computed fields, sanitize data, etc.
    return users.map((user) => ({
      ...user,
      // Example: Add a computed field
      displayName: user.name || user.email.split('@')[0],
    }));
  },
});
