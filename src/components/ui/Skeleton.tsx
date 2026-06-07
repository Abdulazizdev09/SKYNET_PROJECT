interface Props {
  className?: string;
}

/** Shimmering placeholder. Pass width/height via className (e.g. "h-6 w-32"). */
export function Skeleton({ className = '' }: Props) {
  return <div className={`skeleton animate-shimmer rounded ${className}`} />;
}
