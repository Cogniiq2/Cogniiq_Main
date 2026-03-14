import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  variant?: 'default' | 'light';
}

export function Logo({ className, variant = 'default' }: LogoProps) {
  const light = variant === 'light';

  return (
    <svg
      viewBox="0 0 188 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('w-auto', className)}
      aria-label="Cogniiq"
    >
      <defs>
        <linearGradient id="cq-g1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={light ? '#ffffff' : '#0d1f2d'} />
          <stop offset="100%" stopColor={light ? 'rgba(255,255,255,0.7)' : '#2e6f8f'} />
        </linearGradient>
        <linearGradient id="cq-g2" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor={light ? 'rgba(255,255,255,0.4)' : '#1a4a62'} />
          <stop offset="100%" stopColor={light ? 'rgba(255,255,255,0.9)' : '#3d8fad'} />
        </linearGradient>
        <linearGradient id="cq-g3" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={light ? '#ffffff' : '#0d1f2d'} />
          <stop offset="100%" stopColor={light ? 'rgba(255,255,255,0.5)' : '#2a6080'} />
        </linearGradient>
      </defs>

      {/* ── MARK: Neural lattice diamond ──────────────────────────────── */}
      {/*
          Concept: A diamond/rhombus subdivided into 4 triangular facets,
          with a glowing core node and 4 satellite nodes at each corner.
          No letters — pure geometric intelligence signal.
          Inspired by: DeepMind, Palantir, high-end tech marks.
      */}
      <g transform="translate(1, 1)">

        {/* Outer diamond outline — architectural precision */}
        <polygon
          points="19,0 36,18 19,36 2,18"
          fill="none"
          stroke={light ? 'rgba(255,255,255,0.25)' : 'rgba(13,31,45,0.18)'}
          strokeWidth="1"
        />

        {/* Top-left facet */}
        <polygon
          points="19,0 2,18 19,18"
          fill={light ? 'rgba(255,255,255,0.12)' : 'rgba(13,31,45,0.08)'}
          stroke={light ? 'rgba(255,255,255,0.0)' : 'rgba(0,0,0,0)'}
        />

        {/* Top-right facet — slightly brighter */}
        <polygon
          points="19,0 36,18 19,18"
          fill={light ? 'rgba(255,255,255,0.07)' : 'rgba(46,111,143,0.1)'}
        />

        {/* Bottom-left facet */}
        <polygon
          points="2,18 19,36 19,18"
          fill={light ? 'rgba(255,255,255,0.05)' : 'rgba(46,111,143,0.06)'}
        />

        {/* Bottom-right facet */}
        <polygon
          points="36,18 19,36 19,18"
          fill={light ? 'rgba(255,255,255,0.03)' : 'rgba(13,31,45,0.04)'}
        />

        {/* Facet dividers — hairline precision */}
        <line x1="19" y1="0" x2="19" y2="36"
          stroke={light ? 'rgba(255,255,255,0.2)' : 'rgba(46,111,143,0.25)'}
          strokeWidth="0.6" />
        <line x1="2" y1="18" x2="36" y2="18"
          stroke={light ? 'rgba(255,255,255,0.14)' : 'rgba(46,111,143,0.18)'}
          strokeWidth="0.6" />

        {/* Diagonal cross connectors — neural structure */}
        <line x1="2" y1="18" x2="19" y2="0"
          stroke={light ? 'rgba(255,255,255,0.08)' : 'rgba(46,111,143,0.12)'}
          strokeWidth="0.5" strokeDasharray="1.5 2.5" />
        <line x1="36" y1="18" x2="19" y2="0"
          stroke={light ? 'rgba(255,255,255,0.08)' : 'rgba(46,111,143,0.12)'}
          strokeWidth="0.5" strokeDasharray="1.5 2.5" />
        <line x1="2" y1="18" x2="19" y2="36"
          stroke={light ? 'rgba(255,255,255,0.08)' : 'rgba(46,111,143,0.12)'}
          strokeWidth="0.5" strokeDasharray="1.5 2.5" />
        <line x1="36" y1="18" x2="19" y2="36"
          stroke={light ? 'rgba(255,255,255,0.08)' : 'rgba(46,111,143,0.12)'}
          strokeWidth="0.5" strokeDasharray="1.5 2.5" />

        {/* Core node — the intelligence pulse */}
        <circle cx="19" cy="18" r="3.6" fill="url(#cq-g1)" />
        <circle cx="19" cy="18" r="1.6" fill={light ? '#ffffff' : '#ffffff'} opacity="0.95" />

        {/* Corner satellite nodes */}
        <circle cx="19" cy="0" r="2" fill="url(#cq-g1)" opacity="0.9" />
        <circle cx="19" cy="36" r="1.4" fill="url(#cq-g2)" opacity="0.65" />
        <circle cx="2" cy="18" r="1.6" fill="url(#cq-g2)" opacity="0.75" />
        <circle cx="36" cy="18" r="2" fill="url(#cq-g1)" opacity="0.9" />

        {/* Midpoint nodes on the facet edges — micro detail */}
        <circle cx="10.5" cy="9" r="1" fill={light ? 'rgba(255,255,255,0.5)' : '#2e6f8f'} opacity="0.6" />
        <circle cx="27.5" cy="9" r="1" fill={light ? 'rgba(255,255,255,0.5)' : '#2e6f8f'} opacity="0.6" />
        <circle cx="10.5" cy="27" r="0.8" fill={light ? 'rgba(255,255,255,0.3)' : '#1a4a62'} opacity="0.5" />
        <circle cx="27.5" cy="27" r="0.8" fill={light ? 'rgba(255,255,255,0.3)' : '#1a4a62'} opacity="0.5" />
      </g>

      {/* ── WORDMARK ────────────────────────────────────────────────────── */}
      <g>
        {/* "Cogni" — semibold, high contrast */}
        <text
          x="50"
          y="27"
          fontFamily="'SF Pro Display', -apple-system, 'Helvetica Neue', Arial, sans-serif"
          fontSize="20"
          fontWeight="600"
          letterSpacing="-0.5"
          fill={light ? '#ffffff' : '#0d1821'}
        >
          Cogni
        </text>

        {/* "iq" — light weight, steel-teal accent */}
        <text
          x="124"
          y="27"
          fontFamily="'SF Pro Display', -apple-system, 'Helvetica Neue', Arial, sans-serif"
          fontSize="20"
          fontWeight="300"
          letterSpacing="-0.2"
          fill={light ? 'rgba(255,255,255,0.55)' : '#6a9fb5'}
        >
          iq
        </text>

        {/* Ultra-thin vertical separator between "Cogni" and "iq" */}
        <line
          x1="122"
          y1="11"
          x2="122"
          y2="29"
          stroke={light ? 'rgba(255,255,255,0.18)' : 'rgba(46,111,143,0.25)'}
          strokeWidth="0.75"
        />
      </g>
    </svg>
  );
}
