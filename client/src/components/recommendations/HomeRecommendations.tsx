'use client';

import { useEffect, useState } from 'react';
import RecommendationRail from './RecommendationRail';
import { getRecommendations, type RecommendationItem } from '../../lib/commerce';
import { useAuthStore } from '../../store';
import { t } from '../../lib/i18n';

/**
 * Personalized "Recommended for you" rail on the home page. Only shown to a
 * logged-in user (recommendations need their history); renders nothing for
 * guests or when the engine has nothing to suggest.
 */
export default function HomeRecommendations() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [items, setItems] = useState<RecommendationItem[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      setItems([]);
      return;
    }
    let cancelled = false;
    getRecommendations(10)
      .then((recs) => {
        if (!cancelled) setItems(recs);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  if (!isAuthenticated || items.length === 0) return null;

  return (
    <section className="container-main py-6">
      <RecommendationRail
        title={t.recommendations.forYou}
        subtitle={t.recommendations.forYouSubtitle}
        items={items}
      />
    </section>
  );
}
