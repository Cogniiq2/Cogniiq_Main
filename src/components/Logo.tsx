import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  variant?: 'default' | 'light';
  concept?: number;
}

export function Logo({ className, variant = 'default', concept: _concept }: LogoProps) {
  const light = variant === 'light';
  const ink = light ? '#ffffff' : '#0d1117';
  const inkMid = light ? 'rgba(255,255,255,0.45)' : 'rgba(13,17,23,0.38)';

  return (
    <svg
      viewBox="0 0 148 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Cogniiq"
      height="28"
      style={{ width: 'auto' }}
      className={cn('block', className)}
    >
      {/* Cogni — medium weight */}
      <text
        x="0"
        y="22"
        fontFamily="'SF Pro Display','SF Pro Text',-apple-system,'Helvetica Neue',Arial,sans-serif"
        fontSize="20"
        fontWeight="500"
        letterSpacing="-0.6"
        fill={ink}
      >
        Cogni
      </text>
      {/* iq — lighter weight, slightly different fill for the subtle two-tone effect visible in the image */}
      <text
        x="74"
        y="22"
        fontFamily="'SF Pro Display','SF Pro Text',-apple-system,'Helvetica Neue',Arial,sans-serif"
        fontSize="20"
        fontWeight="300"
        letterSpacing="-0.3"
        fill={inkMid}
      >
        iq
      </text>
    </svg>
  );
}
