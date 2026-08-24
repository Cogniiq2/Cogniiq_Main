/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      // Authenticated dashboard motion scale (see src/components/dashboard/tokens.ts).
      // Named utilities rather than arbitrary `duration-[var(--x)]` values, which Tailwind
      // reports as ambiguous (transition-duration vs animation-duration) and may not emit.
      transitionDuration: {
        fast: '140ms',
        base: '180ms',
        slow: '240ms',
      },
      transitionTimingFunction: {
        premium: 'cubic-bezier(0.2, 0, 0, 1)',
      },
      animationDuration: {
        fast: '140ms',
        base: '180ms',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          1: 'hsl(var(--chart-1))',
          2: 'hsl(var(--chart-2))',
          3: 'hsl(var(--chart-3))',
          4: 'hsl(var(--chart-4))',
          5: 'hsl(var(--chart-5))',
        },
        // Public marketing brand ramp. Defined under `html.cq-public-light` in
        // index.css, so these utilities resolve only on public surfaces and can
        // never leak into the authenticated dashboard, which owns `--cq-*`.
        pub: {
          ink: 'var(--pub-ink)',
          'ink-2': 'var(--pub-ink-2)',
          'ink-3': 'var(--pub-ink-3)',
          'ink-4': 'var(--pub-ink-4)',
          paper: 'var(--pub-paper)',
          'paper-2': 'var(--pub-paper-2)',
          card: 'var(--pub-card)',
          signal: 'var(--pub-signal)',
          'signal-ink': 'var(--pub-signal-ink)',
          'signal-wash': 'var(--pub-signal-wash)',
          verify: 'var(--pub-verify)',
          'verify-wash': 'var(--pub-verify-wash)',
          caution: 'var(--pub-caution)',
          'caution-wash': 'var(--pub-caution-wash)',
          hairline: 'var(--pub-hairline)',
          'hairline-soft': 'var(--pub-hairline-soft)',
        },
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
        spotlight: {
          '0%': {
            opacity: '0',
            transform: 'translate(-72%, -62%) scale(0.5)',
          },
          '100%': {
            opacity: '1',
            transform: 'translate(-50%, -40%) scale(1)',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        spotlight: 'spotlight 2s ease 0.75s 1 forwards',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
