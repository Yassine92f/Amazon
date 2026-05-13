import type { ReactNode } from 'react';
import Header from './Header';
import SiteFooter from './SiteFooter';
import MobileTabBar from './MobileTabBar';

export default function InfoPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-bg">
        <div className="container-main max-w-3xl py-12 md:py-16">
          <h1 className="text-3xl font-extrabold text-brand-900 md:text-4xl">{title}</h1>
          {intro && <p className="mt-3 text-base leading-relaxed text-muted">{intro}</p>}
          <div className="mt-8 flex flex-col gap-6 text-sm leading-relaxed text-text [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-brand-900 [&_a]:text-brand-600 [&_a]:underline">
            {children}
          </div>
        </div>
      </main>
      <SiteFooter />
      <MobileTabBar />
    </>
  );
}
