import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import { PubLinkButton } from '@/components/public/PublicUI';
import {
  ArrowRight,
  PhoneCall,
  Globe,
  Zap,
  ShieldCheck,
} from 'lucide-react';

import { ErrorBoundary } from '../ErrorBoundary';

const LazySplineScene = lazy(() =>
  import('../ui/splite').then((module) => ({
    default: module.SplineScene,
  }))
);



function SplineFallback() {
  return (
    <div
      className="h-full w-full rounded-[2rem] border border-pub-hairline-soft bg-gradient-to-br from-white via-[#f8f8f7] to-[#f1f1ef]"
      aria-hidden="true"
    />
  );
}

/**
 * True only when the browser can actually create a WebGL context.
 *
 * Probed once, on demand, with a throwaway canvas. Without this the ~2 MB Spline
 * runtime is downloaded even on machines that cannot render it, and the failure
 * then surfaces as a render-phase throw rather than a graceful skip.
 */
function supportsWebGL(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      canvas.getContext('webgl2') ||
        canvas.getContext('webgl') ||
        canvas.getContext('experimental-webgl')
    );
  } catch {
    return false;
  }
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * True when the visitor has told the browser to economise on data.
 *
 * The scene is decorative (the whole panel is aria-hidden). Spending ~560 KiB of
 * compressed JavaScript plus the scene file on a metered or 2G connection to
 * paint a decoration is not a trade-off the visitor asked for, and Save-Data is
 * exactly how they say so.
 */
function prefersReducedData(): boolean {
  if (typeof navigator === 'undefined') return false;
  const connection = (
    navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }
  ).connection;
  if (!connection) return false;
  if (connection.saveData) return true;
  return connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g';
}

const SPLINE_ORIGIN = 'https://prod.spline.design';
const SPLINE_SCENE = `${SPLINE_ORIGIN}/kZDDjO5HuC9GJUM2/scene.splinecode`;

/**
 * Open the connection to the scene host at the moment we commit to loading it.
 *
 * Measured: the runtime chunk is requested first and the scene fetch then pays a
 * cold DNS + TLS handshake behind it. A preconnect in index.html would fix that
 * ordering but would also open a connection on every page of the site — including
 * mobile, where the 3D hero never renders at all — which is the same waste the
 * removed font preconnects caused. Emitting it here costs nothing to anyone who
 * never reaches this branch.
 */
function preconnectToSceneHost() {
  if (typeof document === 'undefined') return;
  if (document.querySelector(`link[rel="preconnect"][href="${SPLINE_ORIGIN}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = SPLINE_ORIGIN;
  link.crossOrigin = '';
  document.head.appendChild(link);
}

/** requestIdleCallback where it exists, a short timeout where it does not. */
function whenIdle(callback: () => void): () => void {
  const ric = (window as Window & typeof globalThis & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    cancelIdleCallback?: (handle: number) => void;
  }).requestIdleCallback;

  if (typeof ric === 'function') {
    const handle = ric(callback, { timeout: 2000 });
    return () => {
      const cancel = (window as Window & typeof globalThis & {
        cancelIdleCallback?: (handle: number) => void;
      }).cancelIdleCallback;
      cancel?.(handle);
    };
  }

  const handle = window.setTimeout(callback, 200);
  return () => window.clearTimeout(handle);
}

function DeferredSplineScene() {
  const [shouldLoad, setShouldLoad] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Never fetch the 3D runtime when the user asked for reduced motion, when they
    // asked the browser to save data, or when the device cannot render it at all.
    // Each keeps the static fallback instead.
    if (prefersReducedMotion() || prefersReducedData() || !supportsWebGL()) return;

    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let cancelIdle: (() => void) | undefined;
    let onLoad: (() => void) | undefined;

    const begin = () => {
      if (cancelled) return;
      preconnectToSceneHost();
      setShouldLoad(true);
    };

    // Previously this was a bare setTimeout(1800): every desktop visit with WebGL
    // fetched ~2 MB of runtime at a fixed offset, in the middle of the page still
    // settling, whether or not the panel was ever on screen. Now the download waits
    // for the page to finish loading AND for a genuinely idle main thread, so it
    // competes with nothing, and it only starts once the panel is actually near the
    // viewport.
    const schedule = () => {
      if (cancelled) return;
      if (document.readyState === 'complete') {
        cancelIdle = whenIdle(begin);
        return;
      }
      onLoad = () => {
        if (!cancelled) cancelIdle = whenIdle(begin);
      };
      window.addEventListener('load', onLoad, { once: true });
    };

    if (typeof IntersectionObserver !== 'function') {
      schedule();
      return () => {
        cancelled = true;
        cancelIdle?.();
        if (onLoad) window.removeEventListener('load', onLoad);
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          schedule();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(container);

    return () => {
      cancelled = true;
      observer.disconnect();
      cancelIdle?.();
      if (onLoad) window.removeEventListener('load', onLoad);
    };
  }, []);

  if (!shouldLoad) {
    return (
      <div ref={containerRef} className="w-full h-full">
        <SplineFallback />
      </div>
    );
  }

  // ErrorBoundary is required, not defensive styling: react-spline re-throws load
  // failures during render, which Suspense does not catch. Without it a failed scene
  // or WebGL context tears down the whole React root and blanks the painted page.
  return (
    <div ref={containerRef} className="w-full h-full">
      <ErrorBoundary fallback={<SplineFallback />} label="SplineScene">
        <Suspense fallback={<SplineFallback />}>
          <LazySplineScene scene={SPLINE_SCENE} className="w-full h-full" />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}

const services = [
  { icon: PhoneCall, label: 'KI-Telefonassistent', href: '/ki-telefonassistent' },
  { icon: Globe, label: 'Webdesign', href: '/webdesign' },
  { icon: Zap, label: 'Automatisierung', href: '/prozessautomatisierung' },
];


export function DesktopHero() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  return (
    <section
      ref={ref}
      className="relative w-full overflow-hidden bg-white"
      aria-label="Cogniiq — Operative KI-Systeme"
    >
      <div className="relative z-10 mx-auto grid w-full max-w-[1200px] grid-cols-12 items-center gap-6 px-8 pb-16 pt-32 lg:px-10 lg:pb-20 lg:pt-36 xl:pb-24">
        <div className="col-span-12 lg:col-span-6">
          <div className="cq-rise mb-7 flex flex-wrap items-center gap-x-5 gap-y-2" style={{ animationDelay: '0.1s', animationDuration: '0.42s' }}>
            {services.map(({ icon: Icon, label, href }) => (
              <Link
                key={label}
                to={href}
                className="group inline-flex h-9 items-center gap-1.5 text-[13px] font-medium text-pub-ink-3 transition-colors duration-150 hover:text-pub-ink focus-visible:outline-none focus-visible:rounded-full focus-visible:ring-2 focus-visible:ring-pub-signal focus-visible:ring-offset-2"
              >
                <Icon className="h-3.5 w-3.5 text-pub-ink-3 transition-colors group-hover:text-pub-ink" strokeWidth={1.75} aria-hidden="true" />
                {label}
              </Link>
            ))}
          </div>

          <h1 className="mb-6 text-[clamp(40px,4vw,58px)] font-bold leading-[1.05] tracking-[-0.024em] text-pub-ink">
            {['Erreichbar, wenn', 'niemand frei ist.'].map((text, i) => (
              <span
                key={text}
                className="cq-rise block"
                style={{ animationDelay: `${0.16 + i * 0.08}s`, animationDuration: '0.42s' }}
              >
                {text}
              </span>
            ))}
          </h1>

          <p
            className="cq-rise mb-5 text-[clamp(20px,1.7vw,24px)] font-medium leading-[1.3] tracking-[-0.012em] text-pub-ink-3"
            style={{ animationDelay: '0.32s', animationDuration: '0.42s' }}
          >
            Auch nachts. Auch samstags.
          </p>

          <p
            className="cq-rise mb-9 max-w-[52ch] text-[17px] leading-[1.65] text-pub-ink-2"
            style={{ animationDelay: '0.4s', animationDuration: '0.42s' }}
          >
            Ihr KI-Telefonassistent nimmt Anrufe an, wenn Ihr Team gebunden ist —
            abends, am Wochenende, zu Stoßzeiten. Anliegen kommen strukturiert
            bei Ihnen an, statt auf der Mailbox zu enden.
          </p>

          <div
            className="cq-rise flex flex-wrap items-center gap-3"
            style={{ animationDelay: '0.48s', animationDuration: '0.42s' }}
          >
            <PubLinkButton to="/kontakt" variant="primary" size="lg" icon={ArrowRight} iconTrailing>
              Erstgespräch vereinbaren
            </PubLinkButton>
            <PubLinkButton to="#preis-roi-rechner" variant="secondary" size="lg">
              Preis berechnen
            </PubLinkButton>
          </div>

          <p
            data-review-claim="go-live-zeitraum"
            className="cq-rise mt-6 flex items-center gap-2 text-[14px] text-pub-ink-3"
            style={{ animationDelay: '0.56s', animationDuration: '0.42s' }}
          >
            <ShieldCheck className="h-4 w-4 text-pub-verify" strokeWidth={1.75} aria-hidden="true" />
            Kostenlos und unverbindlich · Go-Live erst nach Ihrer Freigabe
          </p>
        </div>

        {/* The 3D scene keeps its component, scene, gates and interaction exactly;
            only the container proportions changed. */}
        <motion.div
          className="relative col-span-12 h-[520px] lg:col-span-6 lg:h-[640px] xl:h-[700px]"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 1.2, delay: 0.3 }}
          aria-hidden="true"
        >
          <DeferredSplineScene />
        </motion.div>
      </div>
    </section>
  );
}