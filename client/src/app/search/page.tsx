'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import CatalogShell from '../../components/catalog/CatalogShell';
import Header from '../../components/Header';

function SearchContent() {
  const params = useSearchParams();
  const query = params.get('q') ?? '';

  return (
    <CatalogShell
      title={query ? `“${query}”` : 'All products'}
      subtitle={query ? 'Search results' : undefined}
      fixedQuery={query || undefined}
    />
  );
}

export default function SearchPage() {
  return (
    <>
      <Header />
      <Suspense
        fallback={
          <div className="container-main py-10 text-center text-sm text-muted">Loading…</div>
        }
      >
        <SearchContent />
      </Suspense>
    </>
  );
}
