import { createGenericHandler } from '@/lib/server/api-handler';
import { postConfig } from '@/lib/server/model-configs';
import {
  postQuerySchema,
  type PostQuery,
  type PostResponse,
} from '@/lib/validation/posts';

// Custom filters specific to posts
function customPostFilters(
  searchParams: URLSearchParams,
  whereConditions: any
) {
  // Handle author-related filters
  const authorNameContains = searchParams.get('authorNameContains');
  const authorEmailContains = searchParams.get('authorEmailContains');

  if (authorNameContains) {
    whereConditions.author = {
      name: { contains: authorNameContains, mode: 'insensitive' },
    };
  }

  if (authorEmailContains) {
    whereConditions.author = {
      email: { contains: authorEmailContains, mode: 'insensitive' },
    };
  }

  // Custom business logic for posts
  const isPublishedOnly = searchParams.get('publishedOnly');
  if (isPublishedOnly === 'true') {
    whereConditions.published = true;
  }
}

// Create the handler using the generic system with validation
export const GET = createGenericHandler({
  modelName: 'post',
  config: postConfig,
  querySchema: postQuerySchema,
  customFilters: customPostFilters,
  // Optional: Modify query before execution
  beforeQuery: (query) => {
    // Always include author by default for posts
    if (!query.select && !query.include) {
      query.include = {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      };
    }
    return query;
  },
  // Optional: Transform results with type safety
  afterQuery: (posts): PostResponse[] => {
    return posts.map((post) => ({
      ...post,
      // Add computed fields
      excerpt: post.content ? post.content.substring(0, 150) + '...' : null,
      wordCount: post.content ? post.content.split(' ').length : 0,
    }));
  },
});
