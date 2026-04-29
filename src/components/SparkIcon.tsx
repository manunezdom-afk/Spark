// Spark brand icon — 4-pointed star with center ring, orange gradient bg.
// Based on the official Spark app icon.

interface SparkIconProps {
  size?: number;
  className?: string;
  /** When true, renders without the rounded-square background (just the star) */
  bare?: boolean;
}

export function SparkIcon({ size = 40, className = '', bare = false }: SparkIconProps) {
  if (bare) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <path
          d="M50 7 C52 28,72 45,93 50 C72 55,52 72,50 93 C48 72,28 55,7 50 C28 45,48 28,50 7Z"
          fill="currentColor"
        />
        <circle cx="50" cy="50" r="13" fill="transparent" stroke="currentColor" strokeWidth="5.5" />
        <circle cx="50" cy="50" r="6" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="spark-bg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#A85C28" />
          <stop offset="100%" stopColor="#C98440" />
        </linearGradient>
      </defs>
      {/* Background */}
      <rect width="100" height="100" rx="22" fill="url(#spark-bg)" />
      {/* 4-pointed star */}
      <path
        d="M50 7 C52 28,72 45,93 50 C72 55,52 72,50 93 C48 72,28 55,7 50 C28 45,48 28,50 7Z"
        fill="white"
      />
      {/* Center ring: orange cutout */}
      <circle cx="50" cy="50" r="13" fill="url(#spark-bg)" />
      {/* Center dot: white */}
      <circle cx="50" cy="50" r="7.5" fill="white" />
    </svg>
  );
}
