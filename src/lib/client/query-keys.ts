import { UserQuery } from '../validation/users';
import { PostQuery } from '../validation/posts';

// Query key factory for consistent query keys
export const queryKeys = {
  // User query keys
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (params?: Partial<UserQuery>) =>
      [...queryKeys.users.lists(), params] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string, params?: Pick<UserQuery, 'select' | 'include'>) =>
      [...queryKeys.users.details(), id, params] as const,
  },

  // Post query keys
  posts: {
    all: ['posts'] as const,
    lists: () => [...queryKeys.posts.all, 'list'] as const,
    list: (params?: Partial<PostQuery>) =>
      [...queryKeys.posts.lists(), params] as const,
    details: () => [...queryKeys.posts.all, 'detail'] as const,
    detail: (id: string, params?: Pick<PostQuery, 'select' | 'include'>) =>
      [...queryKeys.posts.details(), id, params] as const,
  },

  // Generic factory for custom query keys
  custom: (entity: string, params?: any) => [entity, params] as const,
} as const;

// Helper to invalidate related queries
export const invalidationHelpers = {
  users: {
    all: () => queryKeys.users.all,
    lists: () => queryKeys.users.lists(),
    detail: (id: string) => queryKeys.users.detail(id),
  },
  posts: {
    all: () => queryKeys.posts.all,
    lists: () => queryKeys.posts.lists(),
    detail: (id: string) => queryKeys.posts.detail(id),
  },
} as const;
