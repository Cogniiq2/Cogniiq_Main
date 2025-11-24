import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 620 180"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-auto", className)}
      aria-label="CogniIQ"
    >
      {/* COGNI */}
      <text
        x="0"
        y="115"
        fontFamily="Inter, system-ui, sans-serif"
        fontSize="120"
        fontWeight="700"
        letterSpacing="-5"
        fill="#1C2327"
      >
        Cogni
      </text>

      {/* IQ */}
      <text
        x="420"
        y="115"
        fontFamily="Inter, system-ui, sans-serif"
        fontSize="120"
        fontWeight="700"
        letterSpacing="-5"
        fill="#515A61"
      >
        IQ
      </text>
    </svg>
  );
}
