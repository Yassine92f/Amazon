import { Star, StarHalf } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  count?: number;
  size?: 'sm' | 'md';
}

export default function StarRating({ rating, count, size = 'sm' }: StarRatingProps) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.25 && fullStars < 5;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);
  const px = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';

  return (
    <div className="flex items-center gap-1">
      <span className="flex items-center gap-0.5" aria-label={`${rating.toFixed(1)} / 5`}>
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star key={`f${i}`} className={`${px} fill-amber-400 text-amber-400`} aria-hidden />
        ))}
        {hasHalf && <StarHalf className={`${px} fill-amber-400 text-amber-400`} aria-hidden />}
        {Array.from({ length: Math.max(0, emptyStars) }).map((_, i) => (
          <Star key={`e${i}`} className={`${px} text-border-strong`} aria-hidden />
        ))}
      </span>
      {count !== undefined && (
        <span className="text-xs text-muted">({count.toLocaleString('fr-FR')})</span>
      )}
    </div>
  );
}
