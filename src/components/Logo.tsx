import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 330 90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-auto", className)}
      aria-label="CogniIQ"
    >
      {/* WORDMARK: Cogni */}
      <text
        x="0"
        y="65"
        fontFamily="system-ui, -apple-system, 'Segoe UI', 'Roboto', 'Ubuntu'"
        fontSize="68"
        fontWeight="700"
        letterSpacing="-2"
        fill="#1C2327"
        style={{ fontFeatureSettings: "'kern' 1" }}
      >
        Cogni
      </text>

      {/* CUSTOM IQ MARK */}
      <g transform="translate(210, 10)">
        {/* Serif-style "I" */}
        <path
          d="M0 0 H34 V10 H22 V62 H34 V72 H0 V62 H12 V10 H0 Z"
          fill="#515A61"
        />

        {/* Q — custom drawn for perfect balance */}
        <path
          d="
            M70 12
            C55 -4 28 -4 13 12
            C-2 27 -2 54 13 69
            C28 85 55 85 70 69
            C85 54 85 27 70 12
            Z

            M70 12
            L88 32
          "
          stroke="#515A61"
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>
    </svg>
  );
}
