import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 640 200"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-auto", className)}
      aria-label="CogniIQ"
    >
      {/* COGNI (Rounded Luxury Version) */}
      <text
        x="0"
        y="135"
        fontFamily="'Nunito', 'Inter', system-ui, sans-serif"
        fontSize="140"
        fontWeight="800"
        letterSpacing="-6"
        fill="#1C2327"
      >
        Cogni
      </text>

      {/* IQ */}
      <g transform="translate(460,0)">
        <text
          x="0"
          y="135"
          fontFamily="'Nunito', system-ui, sans-serif"
          fontSize="140"
          fontWeight="800"
          letterSpacing="-6"
          fill="#515A61"
        >
          I
        </text>
        <text
          x="60"
          y="135"
          fontFamily="'Nunito', system-ui, sans-serif"
          fontSize="140"
          fontWeight="800"
          letterSpacing="-6"
          fill="#515A61"
        >
          Q
        </text>
      </g>
    </svg>
  );
}
