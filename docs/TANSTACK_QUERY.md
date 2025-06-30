# TanStack Query Integration Documentation

This document explains how TanStack Query has been integrated with your flexible API system, preserving all existing query capabilities while adding powerful client-side state management.

## Overview

The integration provides:

- **Full Query Flexibility**: All your existing query parameters, filtering, pagination, and complex conditions are preserved
- **Type Safety**: Complete TypeScript integration with your Zod schemas
- **Caching & Synchronization**: Intelligent caching with automatic background updates
- **Developer Experience**: DevTools, optimistic updates, and error handling
- **Performance**: Request deduplication, prefetching, and background refetching

## Key Files

```text
src/lib/
├── query-client.ts      # TanStack Query client configuration
├── query-provider.tsx   # React provider component (already existed, enhanced)
├── query-keys.ts        # Query key factory for cache management
├── query-hooks.ts       # Custom hooks for all your API endpoints
├── api-client.ts        # Enhanced API client (preserves existing functionality)
└── validation.ts        # Your existing Zod schemas (unchanged)
```

## Getting Started

### 1. Basic Usage

Your existing query capabilities are fully preserved. Here's how to use them with TanStack Query:

```typescript
import { useUsers, usePosts } from '@/lib/query-hooks';

function MyComponent() {
  // All your existing query parameters work exactly the same
  const {
    data: users,
    isLoading,
    error,
  } = useUsers({
    page: 1,
    limit: 10,
    emailContains: '@company.com',
    hasPublishedPosts: 'true',
    include: 'posts,_count',
    orderBy: 'createdAt',
    orderDir: 'desc',
    // Complex conditions still work
    and: JSON.stringify([
      { createdAfter: '2023-01-01T00:00:00Z' },
      { hasPublishedPosts: true },
    ]),
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {users?.data.map((user) => (
        <div key={user.id}>{user.email}</div>
      ))}
    </div>
  );
}
```

### 2. Search with Debouncing

```typescript
import { useUserSearch } from '@/lib/query-hooks';

function UserSearch() {
  const [searchTerm, setSearchTerm] = useState('');

  // Only triggers API call when searchTerm has content
  // Automatic caching prevents duplicate requests
  const { data: results, isLoading } = useUserSearch(searchTerm, {
    limit: 10,
    include: '_count',
  });

  return (
    <div>
      <input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder='Search users...'
      />
      {/* Results automatically update as you type */}
    </div>
  );
}
```

### 3. Pagination with Prefetching

```typescript
import { useUsersPaginated, usePrefetch } from '@/lib/query-hooks';

function UserList() {
  const [page, setPage] = useState(1);
  const { prefetchUsers } = usePrefetch();

  const { data: users, isLoading } = useUsersPaginated(page, 10, {
    include: 'posts,_count',
  });

  // Prefetch next page on hover for instant navigation
  const handleNextPageHover = () => {
    prefetchUsers({ page: page + 1, limit: 10, include: 'posts,_count' });
  };

  return (
    <div>
      {/* User list */}
      <button
        onClick={() => setPage(page + 1)}
        onMouseEnter={handleNextPageHover} // Prefetch on hover!
      >
        Next Page
      </button>
    </div>
  );
}
```

### 4. Complex Queries

All your complex query capabilities are preserved:

```typescript
import { useComplexUserQuery } from '@/lib/query-hooks';

function ComplexQuery() {
  const { data: users } = useComplexUserQuery(
    {
      and: [
        { createdAfter: '2023-01-01T00:00:00Z' },
        { hasPublishedPosts: true },
      ],
      or: [
        { emailContains: '@company.com' },
        { emailContains: '@enterprise.com' },
      ],
    },
    {
      include: 'posts,_count',
      limit: 20,
      orderBy: 'createdAt',
      orderDir: 'desc',
    }
  );

  return <div>{/* Render complex results */}</div>;
}
```

## Available Hooks

### User Hooks

- `useUsers(params?, options?)` - Fetch users with full query flexibility
- `useUser(id, params?, options?)` - Fetch single user by ID
- `useUsersWithPosts(params?, options?)` - Users with posts included
- `useUserSearch(searchTerm, params?, options?)` - Search users by email
- `useUsersPaginated(page, limit, params?, options?)` - Paginated users with total count
- `useComplexUserQuery(conditions, params?, options?)` - Complex AND/OR queries

### Post Hooks

- `usePosts(params?, options?)` - Fetch posts with full query flexibility
- `usePost(id, params?, options?)` - Fetch single post by ID
- `usePublishedPosts(params?, options?)` - Only published posts
- `usePostSearch(searchTerm, params?, options?)` - Search posts by title
- `usePostsByAuthor(authorEmail, params?, options?)` - Posts by specific author
- `usePostsPaginated(page, limit, params?, options?)` - Paginated posts

### Utility Hooks

- `useInvalidateQueries()` - Manually refresh cache
- `usePrefetch()` - Prefetch queries for better UX

## Query Parameters Support

Every hook supports all your existing query parameters:

### Base Parameters (All Models)

- `select` - Field selection
- `include` - Relation inclusion
- `distinct` - Distinct field selection
- `page`, `limit`, `skip`, `take`, `cursor` - Pagination
- `includeTotalCount` - Include total count in response
- `orderBy`, `orderDir` - Sorting
- `and`, `or` - Complex conditions (JSON strings)

### User-Specific Parameters

- `email`, `name` - Exact field matches
- `emailContains`, `emailStartsWith`, `emailEndsWith` - String operations
- `nameContains` - Name search
- `createdAfter`, `createdBefore`, `updatedAfter`, `updatedBefore` - Date filters
- `hasPublishedPosts`, `hasPosts` - Boolean relation filters
- `postTitleContains` - Nested relation filters

### Post-Specific Parameters

- `title`, `content` - Exact field matches
- `titleContains`, `contentContains` - String operations
- `published` - Boolean filters
- `createdAfter`, `createdBefore`, `updatedAfter`, `updatedBefore` - Date filters
- `hasAuthor`, `authorNameContains`, `authorEmailContains`, `authorEmail` - Author filters
- `publishedOnly` - Custom filter

## Caching Strategy

### Automatic Caching

- Queries are cached for 5 minutes (stale time)
- Cached data persists for 10 minutes (garbage collection time)
- Identical queries share the same cache entry

### Cache Keys

Intelligent cache key generation ensures proper invalidation:

```typescript
// These create different cache entries
useUsers({ page: 1 });
useUsers({ page: 2 });
useUsers({ page: 1, include: 'posts' });

// This reuses the first cache entry
useUsers({ page: 1 }); // Same query, uses cache
```

### Manual Cache Control

```typescript
import { useInvalidateQueries } from '@/lib/query-hooks';

function RefreshButton() {
  const { invalidateUsers, invalidatePosts } = useInvalidateQueries();

  return (
    <div>
      <button onClick={() => invalidateUsers()}>Refresh All Users</button>
      <button onClick={() => invalidateUsers({ page: 1 })}>
        Refresh Page 1 Users
      </button>
    </div>
  );
}
```

## Error Handling

Enhanced error handling with your existing validation:

```typescript
const { data, error, isError } = useUsers({
  page: -1, // Invalid parameter
  email: 'invalid-email', // Invalid email format
});

if (isError) {
  // Error object includes validation details from your Zod schemas
  console.log(error.message); // "Invalid parameters: Number must be greater than or equal to 1"

  // Access validation details if available
  if (error.validation) {
    error.validation.forEach((err) => {
      console.log(`${err.field}: ${err.message}`);
    });
  }
}
```

## Performance Features

### Request Deduplication

Multiple components making the same query share one request:

```typescript
// Both components get the same data, only one API call made
function ComponentA() {
  const { data } = useUsers({ page: 1 });
  return <div>Component A</div>;
}

function ComponentB() {
  const { data } = useUsers({ page: 1 }); // Same query, shares request
  return <div>Component B</div>;
}
```

### Background Refetching

Data is refreshed in the background when:

- Window regains focus (configurable)
- Network reconnects
- Manual invalidation
- Stale time expires

### Prefetching

Load data before it's needed:

```typescript
const { prefetchUsers } = usePrefetch();

// Prefetch next page on hover
<button onMouseEnter={() => prefetchUsers({ page: page + 1 })}>Next</button>;
```

## DevTools

TanStack Query DevTools are automatically included in development:

- View all cached queries
- See query status (loading, success, error)
- Inspect query data
- Manually trigger refetches
- Monitor network requests

## Migration from Direct API Calls

If you were using the API client directly, migration is simple:

### Before

```typescript
import { apiClient } from '@/lib/api-client';

function MyComponent() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .getUsers({ page: 1, limit: 10 })
      .then(setUsers)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;
  return <div>{/* render users */}</div>;
}
```

### After

```typescript
import { useUsers } from '@/lib/query-hooks';

function MyComponent() {
  const { data: users, isLoading } = useUsers({ page: 1, limit: 10 });

  if (isLoading) return <div>Loading...</div>;
  return <div>{/* render users */}</div>;
}
```

## Benefits

1. **No Breaking Changes**: All existing query capabilities preserved
2. **Better UX**: Instant loading states, background updates, prefetching
3. **Better DX**: DevTools, automatic error handling, TypeScript integration
4. **Performance**: Caching, deduplication, optimistic updates
5. **Reliability**: Automatic retries, error boundaries, offline support

## Future Enhancements

The foundation is now in place for:

- **Mutations**: Create, update, delete with optimistic updates
- **Infinite Queries**: Endless scrolling with cursor-based pagination
- **Subscriptions**: Real-time updates via WebSockets
- **Offline Support**: Query persistence and sync

## Example Usage

See `src/components/TanStackQueryDemo.tsx` for a comprehensive example showing all features in action.
