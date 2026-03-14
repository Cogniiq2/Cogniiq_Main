import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  variant?: 'default' | 'light' | 'dark';
}

export function Logo({ className, variant = 'default' }: LogoProps) {
  const isDark = variant === 'light';

  const markPrimary = isDark ? '#ffffff' : '#0a0f14';
  const markAccent = isDark ? 'rgba(255,255,255,0.55)' : '#4a90a4';
  const markAccentAlt = isDark ? 'rgba(255,255,255,0.25)' : '#c8dde6';
  const wordPrimary = isDark ? '#ffffff' : '#0d1821';
  const wordSuffix = isDark ? 'rgba(255,255,255,0.5)' : '#7a9aaa';

  return (
    <svg
      viewBox="0 0 210 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('w-auto', className)}
      aria-label="Cogniiq"
    >
      <defs>
        <linearGradient id="cq-grad-mark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={isDark ? '#ffffff' : '#1a2d3a'} />
          <stop offset="100%" stopColor={isDark ? 'rgba(255,255,255,0.7)' : '#3a7a96'} />
        </linearGradient>
        <linearGradient id="cq-grad-node" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={isDark ? '#ffffff' : '#2a6080'} />
          <stop offset="100%" stopColor={isDark ? 'rgba(255,255,255,0.6)' : '#4a9ab8'} />
        </linearGradient>
        <linearGradient id="cq-grad-ring" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={isDark ? 'rgba(255,255,255,0.9)' : '#1e3a4a'} />
          <stop offset="100%" stopColor={isDark ? 'rgba(255,255,255,0.3)' : '#5a9ab4'} />
        </linearGradient>
      </defs>

      {/* ── MARK: Hexagonal intelligence node ── */}
      <g transform="translate(0, 0)">

        {/* Outer hex shape — crisp, architectural */}
        <polygon
          points="22,2 38,11 38,29 22,38 6,29 6,11"
          fill="none"
          stroke="url(#cq-grad-ring)"
          strokeWidth="1.2"
          opacity="0.35"
        />

        {/* Inner hex fill — subtle depth */}
        <polygon
          points="22,6 34,13 34,27 22,34 10,27 10,13"
          fill={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(26,60,80,0.05)'}
        />

        {/* Arc: the "C" of Cogniiq, precise quarter arc top-left */}
        <path
          d="M 22 9
             A 13 13 0 1 0 22 31"
          stroke="url(#cq-grad-mark)"
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
        />

        {/* Arc cap — top dot */}
        <circle cx="22" cy="9" r="1.6" fill={isDark ? '#ffffff' : '#1a2d3a'} />

        {/* Arc cap — bottom dot */}
        <circle cx="22" cy="31" r="1.6" fill={isDark ? '#ffffff' : '#1a2d3a'} />

        {/* Central node — the intelligence core */}
        <circle cx="22" cy="20" r="3.2" fill="url(#cq-grad-node)" />
        <circle cx="22" cy="20" r="1.4" fill={isDark ? '#ffffff' : '#ffffff'} />

        {/* Neural connectors — 3 lines radiating from center to hex vertices */}
        <line x1="22" y1="20" x2="38" y2="11" stroke={markAccent} strokeWidth="0.8" opacity="0.55" />
        <line x1="22" y1="20" x2="38" y2="29" stroke={markAccent} strokeWidth="0.8" opacity="0.55" />
        <line x1="22" y1="20" x2="22" y2="6" stroke={markAccent} strokeWidth="0.8" opacity="0.35" />

        {/* Vertex nodes on the right side — 2 bright, 1 dim */}
        <circle cx="38" cy="11" r="1.5" fill={markAccent} opacity="0.8" />
        <circle cx="38" cy="29" r="1.5" fill={markAccent} opacity="0.8" />
        <circle cx="22" cy="6" r="1.2" fill={markAccentAlt} opacity="0.6" />
      </g>

      {/* ── WORDMARK ── */}
      <g transform="translate(52, 0)">
        {/* "Cogni" — tight, geometric, high contrast */}
        <text
          y="29"
          fontFamily="-apple-system, 'SF Pro Display', 'Helvetica Neue', 'Arial', sans-serif"
          fontSize="22"
          fontWeight="600"
          letterSpacing="-0.6"
          fill={wordPrimary}
        >
          Cogni
        </text>

        {/* "iq" — lighter weight, color-shifted for sophistication */}
        <text
          x="82"
          y="29"
          fontFamily="-apple-system, 'SF Pro Display', 'Helvetica Neue', 'Arial', sans-serif"
          fontSize="22"
          fontWeight="300"
          letterSpacing="-0.3"
          fill={wordSuffix}
        >
          iq
        </text>

        {/* Separator line between Cogni and iq — ultra-thin, premium */}
        <line
          x1="80"
          y1="10"
          x2="80"
          y2="30"
          stroke={isDark ? 'rgba(255,255,255,0.15)' : 'rgba(26,60,80,0.12)'}
          strokeWidth="0.8"
        />

        {/* Tagline pixel-dot — optional micro detail under the wordmark */}
        <line
          x1="0"
          y1="34"
          x2="106"
          y2="34"
          stroke={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,60,80,0.07)'}
          strokeWidth="0.5"
        />
      </g>
    </svg>
  );
}
