'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import CatalogShell from '../../components/catalog/CatalogShell';
import Header from '../../components/Header';
import { t } from '../../lib/i18n';

function SearchContent() {
  const params = useSearchParams();
  const query = params.get('q') ?? '';

  return (
    <CatalogShell
      title={query ? `“${query}”` : t.catalog.allProducts}
      subtitle={query ? t.catalog.searchResults : undefined}
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
          <div className="container-main py-10 text-center text-sm text-muted">
            {t.common.loading}
          </div>
        }
      >
        <SearchContent />
      </Suspense>
    </>
  );
}
