import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 560 160"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-auto", className)}
      aria-label="CogniIQ"
    >
      {/* COGNI */}
      <g fill="#1C2327">
        <path d="M77 120c-41 0-72-32-72-70s31-70 72-70c22 0 38 8 51 22l-14 13c-9-10-21-16-37-16-29 0-51 22-51 51s22 51 51 51c16 0 28-6 37-16l14 13c-13 14-29 22-51 22z"/>
        <path d="M142 118V4h21v114h-21z"/>
        <path d="M214 120c-33 0-60-27-60-58s27-58 60-58c18 0 33 6 44 18l-14 13c-7-8-17-13-30-13-22 0-39 18-39 40s17 40 39 40c13 0 23-5 30-13l14 13c-11 12-26 18-44 18z"/>
        <path d="M296 118V4h20l53 77h1V4h21v114h-20l-53-77h-1v77h-21z"/>
        <path d="M408 118V4h21v114h-21z"/>
      </g>

      {/* SPACING BETWEEN Cogni → IQ */}
      <g transform="translate(25,0)">
        {/* I */}
        <rect x="440" y="4" width="22" height="114" fill="#515A61" rx="4" />

        {/* Q with luxury tail */}
        <g transform="translate(480,0)">
          <circle cx="50" cy="60" r="50" fill="#515A61" />
          <path
            d="M88 108 L118 138"
            stroke="#515A61"
            strokeWidth="18"
            strokeLinecap="round"
          />
        </g>
      </g>
    </svg>
  );
}
