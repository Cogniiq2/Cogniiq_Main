import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  variant?: 'default' | 'light';
}

export function Logo({ className, variant = 'default' }: LogoProps) {
  const light = variant === 'light';

  const ink = light ? '#ffffff' : '#0d1821';
  const inkMid = light ? 'rgba(255,255,255,0.45)' : '#6a9fb5';
  const inkFaint = light ? 'rgba(255,255,255,0.18)' : 'rgba(13,24,33,0.14)';

  return (
    <svg
      viewBox="0 0 160 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('w-auto', className)}
      aria-label="CogniIQ"
    >
      {/*
        MARK CONCEPT — "Signal Node"
        A 10×10 rounded square (systems, structure, precision) with a
        centred dot (the intelligence core) and two axis lines that
        extend beyond the square (signal, reach, communication).
        Dead-simple. Scales to 12px favicon perfectly.
        No letters, no ambiguity, no randomness.
      */}

      {/* Horizontal axis line — extends left and right past the square */}
      <line x1="0" y1="16" x2="9" y2="16" stroke={inkFaint} strokeWidth="1" strokeLinecap="round" />
      <line x1="23" y1="16" x2="32" y2="16" stroke={inkFaint} strokeWidth="1" strokeLinecap="round" />

      {/* Vertical axis line — extends up and down past the square */}
      <line x1="16" y1="0" x2="16" y2="9" stroke={inkFaint} strokeWidth="1" strokeLinecap="round" />
      <line x1="16" y1="23" x2="16" y2="32" stroke={inkFaint} strokeWidth="1" strokeLinecap="round" />

      {/* The square — rounded corners, clean weight */}
      <rect x="9" y="9" width="14" height="14" rx="3" stroke={ink} strokeWidth="1.5" />

      {/* Core dot — the intelligence */}
      <circle cx="16" cy="16" r="2.2" fill={ink} />

      {/* ── WORDMARK ── */}

      {/* "Cogni" — medium weight */}
      <text
        x="42"
        y="21.5"
        fontFamily="'SF Pro Text', -apple-system, 'Helvetica Neue', Arial, sans-serif"
        fontSize="16"
        fontWeight="500"
        letterSpacing="-0.3"
        fill={ink}
      >
        Cogni
      </text>

      {/* "IQ" — lighter weight, accent colour */}
      <text
        x="103"
        y="21.5"
        fontFamily="'SF Pro Text', -apple-system, 'Helvetica Neue', Arial, sans-serif"
        fontSize="16"
        fontWeight="300"
        letterSpacing="0.5"
        fill={inkMid}
      >
        IQ
      </text>
    </svg>
  );
}
