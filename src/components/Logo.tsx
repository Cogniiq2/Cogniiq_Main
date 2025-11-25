import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 420 110"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-auto", className)}
      aria-label="CogniIQ"
    >

      {/* === COGNI (deep graphite) === */}
      <text
        x="0"
        y="78"
        fontFamily="system-ui, -apple-system, 'Segoe UI', 'Roboto', 'Ubuntu'"
        fontSize="72"
        fontWeight="700"
        letterSpacing="-2"
        fill="#1C2327"
        style={{ fontFeatureSettings: "'kern' 1" }}
      >
        Cogni
      </text>

      {/* === IQ BLOCK (luxury) === */}
      <g transform="translate(250, 8)">
        
        {/* I — premium bar */}
        <rect
          x="0"
          y="0"
          width="20"
          height="86"
          rx="4"
          fill="#515A61"
        />

        {/* Q — luxury circle */}
        <circle
          cx="70"
          cy="43"
          r="38"
          stroke="#515A61"
          strokeWidth="10"
          fill="none"
        />

        {/* Q tail — luxury angled stroke */}
        <path
          d="M102 69 L128 95"
          stroke="#515A61"
          strokeWidth="10"
          strokeLinecap="round"
        />
      </g>

    </svg>
  );
}
