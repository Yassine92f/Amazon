'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import CatalogShell from '../../../components/catalog/CatalogShell';
import Header from '../../../components/Header';
import { t } from '../../../lib/i18n';
import { getCategoryBySlug, type CategoryDto } from '../../../lib/catalog';

export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [category, setCategory] = useState<CategoryDto | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getCategoryBySlug(slug)
      .then((c) => {
        if (!cancelled) setCategory(c);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return (
    <>
      <Header />
      <nav className="container-main py-3 text-xs text-muted">
        <Link href="/" className="hover:text-text">
          {t.catalog.breadcrumbHome}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-text">{category?.name ?? slug}</span>
      </nav>
      {notFound ? (
        <div className="container-main py-20 text-center">
          <h1 className="mb-2 text-2xl font-bold text-brand-900">{t.catalog.categoryNotFound}</h1>
          <p className="text-sm text-muted">{t.catalog.categoryNotFoundDesc}</p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-md bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white"
          >
            {t.common.backHome}
          </Link>
        </div>
      ) : (
        <CatalogShell
          title={category?.name ?? t.catalog.category}
          subtitle={category?.description}
          fixedCategoryId={category?._id}
          hideCategorySection
        />
      )}
    </>
  );
}
