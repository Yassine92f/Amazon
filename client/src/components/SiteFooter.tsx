import Link from 'next/link';
import { Globe } from 'lucide-react';
import { t } from '../lib/i18n';

export default function SiteFooter() {
  return (
    <footer className="bg-brand-900 text-white">
      <div className="container-main py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center">
              <img src="/logo.svg" alt="Abracadabra" className="h-9 w-auto brightness-0 invert" />
            </div>
            <p className="mt-3 text-sm leading-relaxed text-white/50 max-w-[260px]">
              {t.footer.tagline}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-bold mb-3">{t.footer.shop}</h4>
            <nav className="flex flex-col gap-2">
              <Link href="/search" className="text-sm text-white/50 hover:text-white">
                {t.footer.allProducts}
              </Link>
              <Link href="/c/electronics" className="text-sm text-white/50 hover:text-white">
                {t.categories.electronics}
              </Link>
              <Link href="/c/fashion" className="text-sm text-white/50 hover:text-white">
                {t.categories.fashion}
              </Link>
              <Link href="/c/gaming" className="text-sm text-white/50 hover:text-white">
                {t.categories.gaming}
              </Link>
            </nav>
          </div>
          <div>
            <h4 className="text-sm font-bold mb-3">{t.footer.sellers}</h4>
            <nav className="flex flex-col gap-2">
              <Link href="/sellers" className="text-sm text-white/50 hover:text-white">
                {t.footer.allShops}
              </Link>
              <Link href="/become-seller" className="text-sm text-white/50 hover:text-white">
                {t.footer.becomeSeller}
              </Link>
              <Link href="/seller" className="text-sm text-white/50 hover:text-white">
                {t.footer.sellerHub}
              </Link>
            </nav>
          </div>
          <div>
            <h4 className="text-sm font-bold mb-3">{t.footer.company}</h4>
            <nav className="flex flex-col gap-2">
              <Link href="/about" className="text-sm text-white/50 hover:text-white">
                {t.footer.about}
              </Link>
              <Link href="/careers" className="text-sm text-white/50 hover:text-white">
                {t.footer.careers}
              </Link>
              <Link href="/press" className="text-sm text-white/50 hover:text-white">
                {t.footer.press}
              </Link>
            </nav>
          </div>
          <div>
            <h4 className="text-sm font-bold mb-3">{t.footer.legal}</h4>
            <nav className="flex flex-col gap-2">
              <Link href="/privacy" className="text-sm text-white/50 hover:text-white">
                {t.footer.privacy}
              </Link>
              <Link href="/terms" className="text-sm text-white/50 hover:text-white">
                {t.footer.terms}
              </Link>
            </nav>
          </div>
        </div>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/40">
          <span>{t.footer.rights}</span>
          <div className="flex items-center gap-4">
            <span>{t.common.currency}</span>
            <span className="flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5" aria-hidden />
              {t.common.language}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
