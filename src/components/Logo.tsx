import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 280 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-auto", className)}
      aria-label="Cogni IQ"
    >
      {/* MAIN TEXT */}
      <text
        x="0"
        y="62"
        fontFamily="system-ui, -apple-system, 'Segoe UI', 'Roboto', 'Ubuntu', 'Cantarell', 'Noto Sans', sans-serif"
        fontSize="68"
        fontWeight="700"
        letterSpacing="-2"
        style={{ fontFeatureSettings: "'kern' 1" }}
      >
        <tspan fill="#1C2327">Cogni</tspan>
      </text>

      {/* CUSTOM SERIF I */}
      <g transform="translate(205, 6)"> 
        <path
          d="M0 0 H30 V8 H20 V56 H30 V64 H0 V56 H10 V8 H0 Z"
          fill="#515A61"
        />
      </g>

      {/* Q */}
      <text
        x="245"
        y="62"
        fontFamily="system-ui, -apple-system, 'Segoe UI', 'Roboto', 'Ubuntu', 'Cantarell', 'Noto Sans', sans-serif"
        fontSize="68"
        fontWeight="700"
        letterSpacing="-2"
        fill="#515A61"
        style={{ fontFeatureSettings: "'kern' 1" }}
      >
        Q
      </text>
    </svg>
  );
}
