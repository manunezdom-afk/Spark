import { cn } from "@/lib/utils/cn";

export function NovaMark({
  size = 14,
  className,
  variant = "gradient",
}: {
  size?: number;
  className?: string;
  variant?: "outline" | "filled" | "gradient";
}) {
  const fill =
    variant === "gradient"
      ? "url(#nova-spark)"
      : variant === "filled"
        ? "currentColor"
        : "none";
  const stroke = variant === "outline" ? "currentColor" : "none";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("inline-block shrink-0", className)}
      aria-hidden
    >
      {variant === "gradient" && (
        <defs>
          <linearGradient id="nova-spark" x1="0" y1="0" x2="16" y2="16" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="55%" stopColor="#D946EF" />
            <stop offset="100%" stopColor="#FF8A4C" />
          </linearGradient>
        </defs>
      )}
      <path
        d="M8 1.5L9.5 6.5L14.5 8L9.5 9.5L8 14.5L6.5 9.5L1.5 8L6.5 6.5L8 1.5Z"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
