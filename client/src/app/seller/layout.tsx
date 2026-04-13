'use client';

import { ProtectedRoute } from '../../components/ProtectedRoute';
import SellerTopBar from '../../components/seller/SellerTopBar';
import SellerNav from '../../components/seller/SellerNav';
import { t } from '../../lib/i18n';

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute roles={['seller', 'admin']}>
      <SellerTopBar />
      <SellerNav />
      <main className="min-h-screen bg-bg">{children}</main>
      <footer className="bg-brand-900 text-white">
        <div className="container-main flex flex-col items-center justify-between gap-3 py-8 text-xs text-white/60 md:flex-row">
          <span>{t.seller.footerHub}</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white">
              {t.seller.policies}
            </a>
            <a href="#" className="hover:text-white">
              {t.seller.fees}
            </a>
            <a href="#" className="hover:text-white">
              {t.seller.support}
            </a>
          </div>
        </div>
      </footer>
    </ProtectedRoute>
  );
}
