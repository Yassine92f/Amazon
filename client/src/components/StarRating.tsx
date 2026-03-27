interface StarRatingProps {
  rating: number;
  count?: number;
  size?: 'sm' | 'md';
}

export default function StarRating({ rating, count, size = 'sm' }: StarRatingProps) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.25;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);
  const starSize = size === 'sm' ? 'text-sm' : 'text-base';

  return (
    <div className="flex items-center gap-1">
      <span className={`${starSize} leading-none tracking-tight text-amber-400`}>
        {'★'.repeat(fullStars)}
        {hasHalf && '★'}
        {'☆'.repeat(emptyStars)}
      </span>
      {count !== undefined && (
        <span className="text-xs text-muted">({count.toLocaleString('fr-FR')})</span>
      )}
    </div>
  );
}
