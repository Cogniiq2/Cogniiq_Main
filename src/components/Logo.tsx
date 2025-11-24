import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 600 180"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-auto", className)}
      aria-label="CogniIQ"
    >
      <g fill="#1C2327">
        <text
          x="0"
          y="115"
          fontFamily="system-ui, sans-serif"
          fontSize="120"
          fontWeight="700"
          letterSpacing="-4"
        >
          Cogni
        </text>
      </g>

      {/* IQ GROUP */}
      <g transform="translate(390,0)">
        {/* I */}
        <rect x="0" y="12" width="32" height="108" rx="6" fill="#515A61" />

        {/* Q */}
        <g transform="translate(70,0)">
          <circle cx="60" cy="65" r="60" fill="#515A61" />
          <path
            d="M105 110 L145 150"
            stroke="#515A61"
            strokeWidth="20"
            strokeLinecap="round"
          />
        </g>
      </g>
    </svg>
  );
}
