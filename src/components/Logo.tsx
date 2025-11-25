import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 360 95"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-auto", className)}
      aria-label="CogniIQ"
    >
      {/* WORDMARK: Cogni */}
      <text
        x="0"
        y="70"
        fontFamily="system-ui, -apple-system, 'Segoe UI', 'Roboto', 'Ubuntu'"
        fontSize="68"
        fontWeight="700"
        letterSpacing="-2"
        fill="#1C2327"
        style={{ fontFeatureSettings: "'kern' 1" }}
      >
        Cogni
      </text>

      {/* === PREMIUM IQ MARK === */}
      <g transform="translate(225, 10)">
        {/* CUSTOM SERIF CAPITAL I */}
        <path
          d="
            M0 0 
            H38 V10 H24 
            V68 H38 V78 
            H0 V68 H14 
            V10 H0 Z
          "
          fill="#515A61"
        />

        {/* Q CIRCLE */}
        <circle 
          cx="95" 
          cy="44" 
          r="36" 
          stroke="#515A61" 
          strokeWidth="10" 
        />

        {/* Q TAIL */}
        <path
          d="M123 72 L143 92"
          stroke="#515A61"
          strokeWidth="10"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
