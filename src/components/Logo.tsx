import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  variant?: 'default' | 'light';
  concept?: 1 | 2 | 3 | 4 | 5;
}

interface ConceptProps {
  ink: string;
  inkMid: string;
  inkFaint: string;
  className?: string;
}

// ─── CONCEPT 1 ── "Neural Chip"
// IQ rendered as a micro-chip PCB die with pin traces.
// The square is the chip body, "Cogni" is clean medium weight,
// "IQ" sits inside/beside a chip die with tiny data-pin traces.
function Concept1({ ink, inkMid, inkFaint, className }: ConceptProps) {
  return (
    <svg viewBox="0 0 180 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Cogniiq" className={className} style={{ height: '100%', width: 'auto' }}>
      {/* Chip body */}
      <rect x="9" y="8" width="18" height="20" rx="2.5" stroke={ink} strokeWidth="1.4" />

      {/* Chip pins — left side */}
      <line x1="9" y1="13" x2="4" y2="13" stroke={inkMid} strokeWidth="1.1" strokeLinecap="round"/>
      <line x1="9" y1="17.5" x2="4" y2="17.5" stroke={inkMid} strokeWidth="1.1" strokeLinecap="round"/>
      <line x1="9" y1="22" x2="4" y2="22" stroke={inkMid} strokeWidth="1.1" strokeLinecap="round"/>

      {/* Chip pins — right side */}
      <line x1="27" y1="13" x2="32" y2="13" stroke={inkMid} strokeWidth="1.1" strokeLinecap="round"/>
      <line x1="27" y1="17.5" x2="32" y2="17.5" stroke={inkMid} strokeWidth="1.1" strokeLinecap="round"/>
      <line x1="27" y1="22" x2="32" y2="22" stroke={inkMid} strokeWidth="1.1" strokeLinecap="round"/>

      {/* Chip pins — top */}
      <line x1="14.5" y1="8" x2="14.5" y2="3" stroke={inkMid} strokeWidth="1.1" strokeLinecap="round"/>
      <line x1="21.5" y1="8" x2="21.5" y2="3" stroke={inkMid} strokeWidth="1.1" strokeLinecap="round"/>

      {/* Chip pins — bottom */}
      <line x1="14.5" y1="28" x2="14.5" y2="33" stroke={inkMid} strokeWidth="1.1" strokeLinecap="round"/>
      <line x1="21.5" y1="28" x2="21.5" y2="33" stroke={inkMid} strokeWidth="1.1" strokeLinecap="round"/>

      {/* Inner circuit detail */}
      <rect x="13" y="13" width="10" height="10" rx="1.5" stroke={inkFaint} strokeWidth="1" />
      <circle cx="18" cy="18" r="2" fill={ink} />

      {/* Wordmark */}
      <text x="42" y="22.5" fontFamily="'SF Pro Text',-apple-system,'Helvetica Neue',Arial,sans-serif"
        fontSize="17" fontWeight="500" letterSpacing="-0.4" fill={ink}>Cogni</text>
      <text x="107" y="22.5" fontFamily="'SF Pro Text',-apple-system,'Helvetica Neue',Arial,sans-serif"
        fontSize="17" fontWeight="300" letterSpacing="1" fill={inkMid}>IQ</text>
    </svg>
  );
}

// ─── CONCEPT 2 ── "Data Pulse"
// The mark is a rounded square (the chip) with a signal/pulse waveform
// cut through it horizontally — like a brain EEG scan / data throughput.
// "IQ" uses a subtle weight shift + underscore-style accent line.
function Concept2({ ink, inkMid, inkFaint, className }: ConceptProps) {
  return (
    <svg viewBox="0 0 178 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Cogniiq" className={className} style={{ height: '100%', width: 'auto' }}>
      {/* Outer ring — chip boundary */}
      <rect x="8" y="8.5" width="19" height="19" rx="4" stroke={ink} strokeWidth="1.5" />

      {/* Pulse/waveform through the chip */}
      <path
        d="M8 18 L11 18 L12.5 12 L14 18 L15.5 24 L17 18 L18.5 14 L20 18 L22 18 L27 18"
        stroke={inkMid} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"
        clipPath="url(#chip-clip2)"
      />
      <clipPath id="chip-clip2">
        <rect x="8" y="8.5" width="19" height="19" rx="4" />
      </clipPath>

      {/* Tiny corner nodes */}
      <circle cx="11" cy="11.5" r="1.1" fill={inkFaint} />
      <circle cx="24" cy="11.5" r="1.1" fill={inkFaint} />
      <circle cx="11" cy="24.5" r="1.1" fill={inkFaint} />
      <circle cx="24" cy="24.5" r="1.1" fill={inkFaint} />

      {/* Wordmark — Cogni */}
      <text x="38" y="23" fontFamily="'SF Pro Text',-apple-system,'Helvetica Neue',Arial,sans-serif"
        fontSize="17" fontWeight="500" letterSpacing="-0.5" fill={ink}>Cogni</text>

      {/* IQ with a precision micro-underline */}
      <text x="102" y="23" fontFamily="'SF Pro Text',-apple-system,'Helvetica Neue',Arial,sans-serif"
        fontSize="17" fontWeight="300" letterSpacing="1.2" fill={inkMid}>IQ</text>
      <line x1="102" y1="25.5" x2="119" y2="25.5" stroke={inkMid} strokeWidth="0.8" strokeLinecap="round"/>
    </svg>
  );
}

// ─── CONCEPT 3 ── "Quantum Core"
// The mark is a hexagonal frame (hardware/silicon aesthetic) with
// concentric inner structure. "IQ" rendered in a distinctly different weight
// — heavier than "Cogni" — with a small superscript-like treatment.
function Concept3({ ink, inkMid, inkFaint, className }: ConceptProps) {
  // Hexagon points for a 18×18 hex centred at (18, 18)
  const R = 10, cx = 18, cy = 18;
  const hex = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 180) * (60 * i - 30);
    return `${(cx + R * Math.cos(a)).toFixed(2)},${(cy + R * Math.sin(a)).toFixed(2)}`;
  }).join(' ');
  const innerHex = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 180) * (60 * i - 30);
    return `${(cx + (R * 0.55) * Math.cos(a)).toFixed(2)},${(cy + (R * 0.55) * Math.sin(a)).toFixed(2)}`;
  }).join(' ');

  return (
    <svg viewBox="0 0 180 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Cogniiq" className={className} style={{ height: '100%', width: 'auto' }}>
      {/* Outer hex */}
      <polygon points={hex} stroke={ink} strokeWidth="1.4" />
      {/* Inner hex */}
      <polygon points={innerHex} stroke={inkFaint} strokeWidth="1" />
      {/* Core dot */}
      <circle cx="18" cy="18" r="2.4" fill={ink} />
      {/* Spoke lines to corners of inner hex */}
      {Array.from({ length: 6 }, (_, i) => {
        const a = (Math.PI / 180) * (60 * i - 30);
        const ix = (cx + (R * 0.55) * Math.cos(a)).toFixed(2);
        const iy = (cy + (R * 0.55) * Math.sin(a)).toFixed(2);
        return <line key={i} x1={18} y1={18} x2={ix} y2={iy} stroke={inkFaint} strokeWidth="0.8" />;
      })}

      {/* Cogni — normal weight */}
      <text x="40" y="22.5" fontFamily="'SF Pro Text',-apple-system,'Helvetica Neue',Arial,sans-serif"
        fontSize="17" fontWeight="400" letterSpacing="-0.3" fill={ink}>Cogni</text>

      {/* IQ — bold weight for contrast */}
      <text x="104" y="22.5" fontFamily="'SF Pro Text',-apple-system,'Helvetica Neue',Arial,sans-serif"
        fontSize="17" fontWeight="700" letterSpacing="0.2" fill={inkMid}>IQ</text>
    </svg>
  );
}

// ─── CONCEPT 4 ── "Signal Node" (refined evolution of the current mark)
// The original concept polished to perfection:
// cleaner proportions, thicker outer ring, animated-feel inner arc,
// IQ in a distinct mono/technical typeface feeling.
function Concept4({ ink, inkMid, inkFaint, className }: ConceptProps) {
  return (
    <svg viewBox="0 0 176 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Cogniiq" className={className} style={{ height: '100%', width: 'auto' }}>
      {/* Cross hairs — ultra-fine */}
      <line x1="0" y1="18" x2="8.5" y2="18" stroke={inkFaint} strokeWidth="0.9" strokeLinecap="round"/>
      <line x1="27.5" y1="18" x2="36" y2="18" stroke={inkFaint} strokeWidth="0.9" strokeLinecap="round"/>
      <line x1="18" y1="0" x2="18" y2="8.5" stroke={inkFaint} strokeWidth="0.9" strokeLinecap="round"/>
      <line x1="18" y1="27.5" x2="18" y2="36" stroke={inkFaint} strokeWidth="0.9" strokeLinecap="round"/>

      {/* Outer square — sharper radius, heavier stroke */}
      <rect x="8.5" y="8.5" width="19" height="19" rx="4" stroke={ink} strokeWidth="1.6" />

      {/* Inner arc — top-right quadrant — the "loading data" cue */}
      <path d="M18 11.5 A6.5 6.5 0 0 1 24.5 18" stroke={inkMid} strokeWidth="1.4" strokeLinecap="round"/>

      {/* Core — larger, more presence */}
      <circle cx="18" cy="18" r="2.5" fill={ink} />

      {/* Tick marks on the square edges — data measure feel */}
      <line x1="15" y1="8.5" x2="15" y2="10.5" stroke={inkMid} strokeWidth="1" strokeLinecap="round"/>
      <line x1="21" y1="8.5" x2="21" y2="10.5" stroke={inkMid} strokeWidth="1" strokeLinecap="round"/>

      {/* Cogni */}
      <text x="44" y="23" fontFamily="'SF Pro Text',-apple-system,'Helvetica Neue',Arial,sans-serif"
        fontSize="17" fontWeight="500" letterSpacing="-0.4" fill={ink}>Cogni</text>

      {/* IQ — separated by a hairline vertical rule */}
      <line x1="109" y1="11" x2="109" y2="25" stroke={inkFaint} strokeWidth="0.9"/>
      <text x="114" y="23" fontFamily="'SF Pro Text',-apple-system,'Helvetica Neue',Arial,sans-serif"
        fontSize="17" fontWeight="300" letterSpacing="1.5" fill={inkMid}>IQ</text>
    </svg>
  );
}

// ─── CONCEPT 5 ── "Circuit Brain"
// The mark blends a rounded square chip with a partial circle arc that
// suggests a brain hemisphere scan. Two data-trace lines exit the chip
// bottom like PCB traces routing to a board. Most dynamic of the five.
function Concept5({ ink, inkMid, inkFaint, className }: ConceptProps) {
  return (
    <svg viewBox="0 0 180 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Cogniiq" className={className} style={{ height: '100%', width: 'auto' }}>
      {/* Main chip square */}
      <rect x="8" y="8" width="20" height="20" rx="3.5" stroke={ink} strokeWidth="1.5" />

      {/* Outer arc — brain/signal scan, top hemisphere */}
      <path d="M8 18 A10 10 0 0 1 28 18" stroke={inkFaint} strokeWidth="1.1" strokeLinecap="round"/>

      {/* Inner arc — tighter, more confident */}
      <path d="M11.5 18 A6.5 6.5 0 0 1 24.5 18" stroke={inkMid} strokeWidth="1.3" strokeLinecap="round"/>

      {/* PCB trace routes from chip bottom */}
      <path d="M13 28 L13 33 L10 33" stroke={inkFaint} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M23 28 L23 33 L26 33" stroke={inkFaint} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>

      {/* Core intelligence dot */}
      <circle cx="18" cy="18" r="2.3" fill={ink} />

      {/* Small data nodes */}
      <circle cx="11.5" cy="18" r="1" fill={inkMid} />
      <circle cx="24.5" cy="18" r="1" fill={inkMid} />

      {/* Wordmark */}
      <text x="40" y="23" fontFamily="'SF Pro Text',-apple-system,'Helvetica Neue',Arial,sans-serif"
        fontSize="17" fontWeight="500" letterSpacing="-0.4" fill={ink}>Cogni</text>

      {/* IQ — larger, bolder, own presence */}
      <text x="103" y="23" fontFamily="'SF Pro Text',-apple-system,'Helvetica Neue',Arial,sans-serif"
        fontSize="18" fontWeight="600" letterSpacing="0.5" fill={inkMid}>IQ</text>
    </svg>
  );
}

export function Logo({ className, variant = 'default', concept = 4 }: LogoProps) {
  const light = variant === 'light';

  const ink = light ? '#ffffff' : '#0d1821';
  const inkMid = light ? 'rgba(255,255,255,0.50)' : '#5a8fa8';
  const inkFaint = light ? 'rgba(255,255,255,0.16)' : 'rgba(13,24,33,0.15)';

  const props = { ink, inkMid, inkFaint };

  return (
    <>
      {concept === 1 && <Concept1 {...props} className={cn('w-auto', className)} />}
      {concept === 2 && <Concept2 {...props} className={cn('w-auto', className)} />}
      {concept === 3 && <Concept3 {...props} className={cn('w-auto', className)} />}
      {concept === 4 && <Concept4 {...props} className={cn('w-auto', className)} />}
      {concept === 5 && <Concept5 {...props} className={cn('w-auto', className)} />}
    </>
  );
}
