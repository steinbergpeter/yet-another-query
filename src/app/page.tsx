'use client';

import { Suspense } from 'react';
import TanStackQueryDemo from '@/components/TanStackQueryDemo';

function ErrorBoundary({ children }: { children: React.ReactNode }) {
  try {
    return <>{children}</>;
  } catch (error) {
    console.error('Page error:', error);
    return (
      <div className='p-4 bg-red-50 border border-red-200 rounded'>
        <h2 className='text-red-800 font-semibold'>Error Loading Page</h2>
        <p className='text-red-600'>
          {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      </div>
    );
  }
}

export default function Home() {
  return (
    <div className='min-h-screen bg-gray-50'>
      <ErrorBoundary>
        <Suspense fallback={<div className='p-4'>Loading...</div>}>
          <TanStackQueryDemo />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
