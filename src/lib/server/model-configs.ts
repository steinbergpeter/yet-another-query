import { ModelConfig } from './query-builder';

// User model configuration
export const userConfig: ModelConfig = {
  stringFields: ['email', 'name'],
  dateFields: ['createdAt', 'updatedAt'],
  relations: {
    posts: {
      searchableFields: ['title', 'content'],
      booleanFilters: ['hasPublishedPosts', 'hasPosts'],
    },
  },
  defaultOrderBy: 'createdAt',
  defaultOrderDir: 'desc',
  defaultLimit: 10,
  maxLimit: 100,
};

// Post model configuration
export const postConfig: ModelConfig = {
  stringFields: ['title', 'content'],
  booleanFields: ['published'],
  dateFields: ['createdAt', 'updatedAt'],
  relations: {
    author: {
      searchableFields: ['name', 'email'],
      booleanFilters: ['hasAuthor'],
    },
  },
  defaultOrderBy: 'createdAt',
  defaultOrderDir: 'desc',
  defaultLimit: 20,
  maxLimit: 100,
};
