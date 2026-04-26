import { Star } from 'lucide-react';

interface RatingStarsProps {
  rating: number;
  max?: number;
  size?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

export function RatingStars({ rating, max = 5, size = 16, interactive = false, onChange }: RatingStarsProps) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          size={size}
          className={`${
            i < rating ? 'fill-gold text-gold' : 'text-muted-foreground/30'
          } ${interactive ? 'cursor-pointer hover:text-gold transition-colors' : ''}`}
          onClick={() => interactive && onChange?.(i + 1)}
        />
      ))}
    </div>
  );
}
