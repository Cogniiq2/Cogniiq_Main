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
        <tspan dx="6" fill="#515A61">I</tspan>
        <tspan fill="#515A61">Q</tspan>
      </text>
    </svg>
  );
}
