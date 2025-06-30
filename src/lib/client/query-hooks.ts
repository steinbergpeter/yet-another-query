'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
  QueryKey,
} from '@tanstack/react-query';
import { apiClient, ApiClient } from './api-client';
import { queryKeys, invalidationHelpers } from './query-keys';
import { UserQuery, UserApiResponse, UserResponse } from '../validation/users';
import { PostQuery, PostApiResponse, PostResponse } from '../validation/posts';

// ================================
// USER HOOKS
// ================================

/**
 * Fetch users with full query parameter support
 * Preserves all validation, filtering, pagination, etc.
 */
export function useUsers(
  params?: Partial<UserQuery>,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    select?: (data: UserApiResponse) => any;
  }
): UseQueryResult<UserApiResponse, Error> {
  return useQuery({
    queryKey: queryKeys.users.list(params),
    queryFn: () => apiClient.getUsers(params),
    enabled: options?.enabled,
    staleTime: options?.staleTime,
    select: options?.select,
  });
}

/**
 * Fetch a single user by ID with optional selection/inclusion
 */
export function useUser(
  id: string,
  params?: Pick<UserQuery, 'select' | 'include'>,
  options?: {
    enabled?: boolean;
    staleTime?: number;
  }
): UseQueryResult<UserResponse, Error> {
  return useQuery({
    queryKey: queryKeys.users.detail(id, params),
    queryFn: () => {
      // Create a new API method for single user fetch
      const queryString = params
        ? new URLSearchParams(
            Object.entries(params).filter(([_, v]) => v != null) as [
              string,
              string
            ][]
          ).toString()
        : '';
      const url = `/api/users/${id}${queryString ? `?${queryString}` : ''}`;

      return fetch(url).then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch user ${id}`);
        return res.json();
      });
    },
    enabled: options?.enabled && !!id,
    staleTime: options?.staleTime,
  });
}

/**
 * Convenient hook for users with posts included
 */
export function useUsersWithPosts(
  params?: Omit<Partial<UserQuery>, 'include'>,
  options?: { enabled?: boolean }
) {
  return useUsers({ ...params, include: 'posts,_count' }, options);
}

/**
 * Search users by email with debouncing support
 */
export function useUserSearch(
  searchTerm: string,
  params?: Omit<Partial<UserQuery>, 'emailContains'>,
  options?: {
    enabled?: boolean;
    debounceMs?: number;
  }
) {
  return useUsers(
    searchTerm ? { ...params, emailContains: searchTerm } : undefined,
    {
      enabled: (options?.enabled ?? true) && searchTerm.length > 0,
      staleTime: 1000 * 60 * 2, // 2 minutes for searches
    }
  );
}

/**
 * Paginated users hook with total count
 */
export function useUsersPaginated(
  page: number,
  limit: number = 10,
  params?: Omit<Partial<UserQuery>, 'page' | 'limit' | 'includeTotalCount'>,
  options?: { enabled?: boolean }
) {
  return useUsers({ ...params, page, limit, includeTotalCount: true }, options);
}

// ================================
// POST HOOKS
// ================================

/**
 * Fetch posts with full query parameter support
 */
export function usePosts(
  params?: Partial<PostQuery>,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    select?: (data: PostApiResponse) => any;
  }
): UseQueryResult<PostApiResponse, Error> {
  return useQuery({
    queryKey: queryKeys.posts.list(params),
    queryFn: () => apiClient.getPosts(params),
    enabled: options?.enabled,
    staleTime: options?.staleTime,
    select: options?.select,
  });
}

/**
 * Fetch a single post by ID
 */
export function usePost(
  id: string,
  params?: Pick<PostQuery, 'select' | 'include'>,
  options?: {
    enabled?: boolean;
    staleTime?: number;
  }
): UseQueryResult<PostResponse, Error> {
  return useQuery({
    queryKey: queryKeys.posts.detail(id, params),
    queryFn: () => {
      const queryString = params
        ? new URLSearchParams(
            Object.entries(params).filter(([_, v]) => v != null) as [
              string,
              string
            ][]
          ).toString()
        : '';
      const url = `/api/posts/${id}${queryString ? `?${queryString}` : ''}`;

      return fetch(url).then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch post ${id}`);
        return res.json();
      });
    },
    enabled: options?.enabled && !!id,
    staleTime: options?.staleTime,
  });
}

/**
 * Fetch only published posts
 */
export function usePublishedPosts(
  params?: Omit<Partial<PostQuery>, 'published'>,
  options?: { enabled?: boolean }
) {
  return usePosts({ ...params, published: 'true' }, options);
}

/**
 * Search posts by title
 */
export function usePostSearch(
  searchTerm: string,
  params?: Omit<Partial<PostQuery>, 'titleContains'>,
  options?: {
    enabled?: boolean;
    debounceMs?: number;
  }
) {
  return usePosts(
    searchTerm ? { ...params, titleContains: searchTerm } : undefined,
    {
      enabled: (options?.enabled ?? true) && searchTerm.length > 0,
      staleTime: 1000 * 60 * 2, // 2 minutes for searches
    }
  );
}

/**
 * Fetch posts by author
 */
export function usePostsByAuthor(
  authorEmail: string,
  params?: Omit<Partial<PostQuery>, 'authorEmail'>,
  options?: { enabled?: boolean }
) {
  return usePosts(authorEmail ? { ...params, authorEmail } : undefined, {
    enabled: (options?.enabled ?? true) && !!authorEmail,
  });
}

/**
 * Paginated posts hook
 */
export function usePostsPaginated(
  page: number,
  limit: number = 20,
  params?: Omit<Partial<PostQuery>, 'page' | 'limit' | 'includeTotalCount'>,
  options?: { enabled?: boolean }
) {
  return usePosts({ ...params, page, limit, includeTotalCount: true }, options);
}

// ================================
// COMPLEX QUERY HOOKS
// ================================

/**
 * Hook for complex AND/OR conditions
 */
export function useComplexUserQuery(
  conditions: {
    and?: any[];
    or?: any[];
  },
  params?: Omit<Partial<UserQuery>, 'and' | 'or'>,
  options?: { enabled?: boolean }
) {
  const queryParams: Partial<UserQuery> = { ...params };

  if (conditions.and) {
    queryParams.and = JSON.stringify(conditions.and);
  }
  if (conditions.or) {
    queryParams.or = JSON.stringify(conditions.or);
  }

  return useUsers(queryParams, options);
}

export function useComplexPostQuery(
  conditions: {
    and?: any[];
    or?: any[];
  },
  params?: Omit<Partial<PostQuery>, 'and' | 'or'>,
  options?: { enabled?: boolean }
) {
  const queryParams: Partial<PostQuery> = { ...params };

  if (conditions.and) {
    queryParams.and = JSON.stringify(conditions.and);
  }
  if (conditions.or) {
    queryParams.or = JSON.stringify(conditions.or);
  }

  return usePosts(queryParams, options);
}

// ================================
// MUTATION HOOKS (for future use)
// ================================

/**
 * Create user mutation
 */
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData: any) => {
      // Implement create user API call
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error('Failed to create user');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate users queries
      queryClient.invalidateQueries({
        queryKey: invalidationHelpers.users.all(),
      });
    },
  });
}

/**
 * Update user mutation
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update user');
      }

      return response.json();
    },
    onSuccess: (_, { id }) => {
      // Invalidate specific user and lists
      queryClient.invalidateQueries({
        queryKey: invalidationHelpers.users.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: invalidationHelpers.users.lists(),
      });
    },
  });
}

/**
 * Create post mutation
 */
export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postData: any) => {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        throw new Error('Failed to create post');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate posts queries
      queryClient.invalidateQueries({
        queryKey: invalidationHelpers.posts.all(),
      });
    },
  });
}

// ================================
// UTILITY HOOKS
// ================================

/**
 * Hook to manually invalidate queries
 */
export function useInvalidateQueries() {
  const queryClient = useQueryClient();

  return {
    invalidateUsers: (params?: Partial<UserQuery>) => {
      if (params) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.users.list(params),
        });
      } else {
        queryClient.invalidateQueries({
          queryKey: invalidationHelpers.users.all(),
        });
      }
    },
    invalidatePosts: (params?: Partial<PostQuery>) => {
      if (params) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.posts.list(params),
        });
      } else {
        queryClient.invalidateQueries({
          queryKey: invalidationHelpers.posts.all(),
        });
      }
    },
    invalidateUser: (id: string) => {
      queryClient.invalidateQueries({
        queryKey: invalidationHelpers.users.detail(id),
      });
    },
    invalidatePost: (id: string) => {
      queryClient.invalidateQueries({
        queryKey: invalidationHelpers.posts.detail(id),
      });
    },
  };
}

/**
 * Hook to prefetch queries
 */
export function usePrefetch() {
  const queryClient = useQueryClient();

  return {
    prefetchUsers: (params?: Partial<UserQuery>) => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.users.list(params),
        queryFn: () => apiClient.getUsers(params),
        staleTime: 1000 * 60 * 5, // 5 minutes
      });
    },
    prefetchPosts: (params?: Partial<PostQuery>) => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.posts.list(params),
        queryFn: () => apiClient.getPosts(params),
        staleTime: 1000 * 60 * 5, // 5 minutes
      });
    },
  };
}
