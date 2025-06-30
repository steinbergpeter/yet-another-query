'use client';

import {
  useComplexUserQuery,
  useInvalidateQueries,
  usePrefetch,
  usePublishedPosts,
  useUsers,
  useUserSearch,
  useUsersPaginated,
} from '@/lib/client/query-hooks';
import { useState } from 'react';

export default function TanStackQueryDemo() {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const { invalidateUsers, invalidatePosts } = useInvalidateQueries();
  const { prefetchUsers } = usePrefetch();

  // Basic queries with all your existing flexibility
  const {
    data: users,
    isLoading: usersLoading,
    error: usersError,
  } = useUsers({
    limit: 5,
    include: '_count',
    orderBy: 'createdAt',
    orderDir: 'desc',
  });

  // Search users (will only trigger when searchTerm has content)
  const { data: searchResults, isLoading: searchLoading } = useUserSearch(
    searchTerm,
    {
      limit: 10,
    }
  );

  // Paginated users with total count
  const { data: paginatedUsers, isLoading: paginationLoading } =
    useUsersPaginated(page, 10, { include: 'posts,_count' });

  // Published posts only
  const { data: publishedPosts } = usePublishedPosts({
    limit: 5,
    include: 'author',
    orderBy: 'createdAt',
    orderDir: 'desc',
  });

  // Complex query with AND conditions
  const { data: complexUsers, error: complexUsersError } = useComplexUserQuery(
    {
      and: [
        { createdAt: { gte: '2023-01-01T00:00:00Z' } },
        { posts: { some: { published: true } } },
      ],
    },
    {
      include: 'posts,_count',
      limit: 10,
    }
  );

  // Prefetch next page on hover
  const handleNextPageHover = () => {
    prefetchUsers({
      page: page + 1,
      limit: 10,
      include: 'posts,_count',
    });
  };

  if (usersLoading) return <div className='p-8'>Loading users...</div>;
  if (usersError)
    return <div className='p-8 text-red-500'>Error: {usersError.message}</div>;

  return (
    <div className='max-w-6xl mx-auto p-8 space-y-8'>
      <div className='bg-white rounded-lg shadow-lg p-6'>
        <h1 className='text-3xl font-bold text-gray-900 mb-6'>
          TanStack Query + Your Flexible API System
        </h1>

        <div className='bg-green-50 border border-green-200 rounded-lg p-4 mb-6'>
          <h2 className='text-lg font-semibold text-green-800 mb-2'>
            ✅ Integration Complete!
          </h2>
          <p className='text-green-700'>
            All your existing query capabilities are preserved and enhanced with
            TanStack Query:
          </p>
          <ul className='list-disc list-inside mt-2 text-green-700 space-y-1'>
            <li>Full pagination support (page, limit, skip, take, cursor)</li>
            <li>Complex filtering and search capabilities</li>
            <li>Selection and inclusion controls</li>
            <li>Ordering and sorting</li>
            <li>Complex AND/OR conditions</li>
            <li>Runtime validation with Zod schemas</li>
            <li>Type safety throughout</li>
          </ul>
        </div>

        {/* Cache Controls */}
        <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6'>
          <h3 className='text-lg font-semibold text-blue-800 mb-3'>
            Cache Controls
          </h3>
          <div className='flex gap-2'>
            <button
              onClick={() => invalidateUsers()}
              className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700'
            >
              Refresh Users Cache
            </button>
            <button
              onClick={() => invalidatePosts()}
              className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700'
            >
              Refresh Posts Cache
            </button>
          </div>
        </div>
      </div>

      {/* Search Demo */}
      <div className='bg-white rounded-lg shadow-lg p-6'>
        <h2 className='text-xl font-semibold mb-4'>
          Search Users (with debouncing)
        </h2>
        <input
          type='text'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder='Search users by email...'
          className='w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
        />

        {searchLoading && <p className='mt-2 text-gray-500'>Searching...</p>}

        {searchResults && searchResults.data.length > 0 && (
          <div className='mt-4'>
            <h3 className='font-semibold mb-2'>Search Results:</h3>
            <div className='space-y-2'>
              {searchResults.data.map((user: any) => (
                <div key={user.id} className='p-3 bg-gray-50 rounded'>
                  <p className='font-medium'>{user.email}</p>
                  <p className='text-sm text-gray-600'>
                    {user.name || 'No name'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Users List */}
      <div className='bg-white rounded-lg shadow-lg p-6'>
        <h2 className='text-xl font-semibold mb-4'>
          Recent Users (with post counts)
        </h2>
        <div className='space-y-3'>
          {users?.data.map((user: any) => (
            <div
              key={user.id}
              className='p-4 border border-gray-200 rounded-lg'
            >
              <div className='flex justify-between items-start'>
                <div>
                  <h3 className='font-semibold'>{user.email}</h3>
                  <p className='text-gray-600'>{user.name || 'No name'}</p>
                  <p className='text-sm text-gray-500'>
                    Created: {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className='text-right'>
                  <p className='text-sm text-gray-500'>
                    Posts: {user._count?.posts || 0}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination Demo */}
      <div className='bg-white rounded-lg shadow-lg p-6'>
        <h2 className='text-xl font-semibold mb-4'>
          Paginated Users (with posts included)
        </h2>

        <div className='flex justify-between items-center mb-4'>
          <div className='flex gap-2'>
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className='px-4 py-2 bg-gray-300 text-gray-700 rounded disabled:opacity-50'
            >
              Previous
            </button>
            <span className='px-4 py-2 bg-gray-100 rounded'>Page {page}</span>
            <button
              onClick={() => setPage(page + 1)}
              onMouseEnter={handleNextPageHover} // Prefetch on hover!
              disabled={
                !paginatedUsers?.pagination.totalPages ||
                page >= paginatedUsers.pagination.totalPages
              }
              className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50'
            >
              Next
            </button>
          </div>

          {paginatedUsers?.pagination.totalCount && (
            <p className='text-sm text-gray-600'>
              Total: {paginatedUsers.pagination.totalCount} users
            </p>
          )}
        </div>

        {paginationLoading ? (
          <p>Loading page {page}...</p>
        ) : (
          <div className='space-y-3'>
            {paginatedUsers?.data.map((user: any) => (
              <div
                key={user.id}
                className='p-4 border border-gray-200 rounded-lg'
              >
                <div className='flex justify-between items-start'>
                  <div>
                    <h3 className='font-semibold'>{user.email}</h3>
                    <p className='text-gray-600'>{user.name || 'No name'}</p>
                  </div>
                  <div className='text-right'>
                    <p className='text-sm text-gray-500'>
                      {user.posts?.length || 0} posts
                    </p>
                  </div>
                </div>

                {user.posts && user.posts.length > 0 && (
                  <div className='mt-3 pl-4 border-l-2 border-gray-200'>
                    <h4 className='text-sm font-medium text-gray-700 mb-1'>
                      Recent Posts:
                    </h4>
                    {user.posts.slice(0, 2).map((post: any) => (
                      <p key={post.id} className='text-sm text-gray-600'>
                        • {post.title}{' '}
                        {post.published ? '(Published)' : '(Draft)'}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Published Posts */}
      <div className='bg-white rounded-lg shadow-lg p-6'>
        <h2 className='text-xl font-semibold mb-4'>
          Latest Published Posts (with authors)
        </h2>
        <div className='space-y-3'>
          {publishedPosts?.data.map((post: any) => (
            <div
              key={post.id}
              className='p-4 border border-gray-200 rounded-lg'
            >
              <h3 className='font-semibold'>{post.title}</h3>
              <p className='text-gray-600 mt-1'>
                {post.excerpt || post.content?.substring(0, 100) + '...'}
              </p>
              <div className='flex justify-between items-center mt-2'>
                <p className='text-sm text-gray-500'>
                  By: {post.author?.name || post.author?.email || 'Unknown'}
                </p>
                <p className='text-sm text-gray-500'>
                  {new Date(post.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Complex Query Demo */}
      {complexUsersError && (
        <div className='bg-red-50 border border-red-200 rounded-lg p-4 mb-6'>
          <h2 className='text-lg font-semibold text-red-800 mb-2'>
            Complex Query Error:
          </h2>
          <p className='text-red-700'>
            Error fetching user: {complexUsersError.message}
          </p>
        </div>
      )}
      {complexUsers && (
        <div className='bg-white rounded-lg shadow-lg p-6'>
          <h2 className='text-xl font-semibold mb-4'>
            Complex Query: Users created after 2023 with published posts
          </h2>
          <div className='space-y-3'>
            {complexUsers.data.map((user: any) => (
              <div
                key={user.id}
                className='p-4 border border-gray-200 rounded-lg'
              >
                <h3 className='font-semibold'>{user.email}</h3>
                <p className='text-gray-600'>{user.name || 'No name'}</p>
                <p className='text-sm text-gray-500'>
                  {user._count?.posts || 0} total posts
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
