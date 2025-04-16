import { Star } from "lucide-react";

interface StarRatingDisplayProps {
  value: number;
  size?: number;
}

/**
 * A read-only star rating display component that can be used in server components
 */
export function StarRatingDisplay({ value, size = 20 }: StarRatingDisplayProps) {
  const stars = Array.from({ length: 5 }, (_, i) => (
    <Star
      key={i}
      size={size}
      className={`${
        i < value
          ? "fill-primary text-primary"
          : "fill-muted text-muted-foreground"
      }`}
    />
  ));

  return <div className="flex">{stars}</div>;
} 
