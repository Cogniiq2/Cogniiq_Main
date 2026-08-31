import { useCallback, useEffect, useState, type ReactNode } from 'react';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';

import { cn } from '@/lib/utils';

// The navigation rail's scroll container.
//
// WHY NOT `overflow-y-auto`
// -------------------------
// The rail is a 272px column of chrome. A native scrollbar in it is 12-17px of
// platform-styled furniture — on Windows and most Linux desktops a permanently
// visible light-grey trough — which is 6% of the rail's width and reads louder
// than the navigation itself. It also shifts every item horizontally the moment
// the content starts to overflow.
//
// WHY NOT `@/components/ui/scroll-area`
// -------------------------------------
// That component is the shadcn default: a 10px bar whose thumb paints with the
// PUBLIC `--border` token. Both are wrong here (too heavy, wrong palette) and
// widening its API to carry rail-specific styling would push chrome decisions
// into a primitive the marketing surfaces also use. This composes the same
// underlying Radix package directly and keeps the rail's styling local.
//
// BEHAVIOUR PRESERVED
// -------------------
// Radix's Viewport is a real scroll container, so wheel, trackpad, touch,
// scroll-into-view on Tab, Home/End/PageUp/PageDown and screen-reader scroll
// all behave exactly as they did with `overflow-y-auto`. Nothing here intercepts
// input; the custom bar is a presentation layer over native scrolling.

/**
 * Tracks whether content is clipped above/below, so the rail can hint at more
 * navigation instead of relying on a scrollbar that is hidden until hover.
 *
 * Recomputed on scroll, on element resize and on content resize — a rail whose
 * sub-navigation changes with the route must not keep a stale affordance.
 */
function useOverflowEdges(viewport: HTMLDivElement | null) {
  const [edges, setEdges] = useState({ top: false, bottom: false });

  const measure = useCallback((element: HTMLDivElement) => {
    const { scrollTop, scrollHeight, clientHeight } = element;
    // 1px of slack: sub-pixel layout makes an exactly-fitting rail report a
    // fractional overflow, which would leave a permanent fade on a rail that
    // does not actually scroll.
    const top = scrollTop > 1;
    const bottom = scrollTop + clientHeight < scrollHeight - 1;
    setEdges((previous) =>
      previous.top === top && previous.bottom === bottom ? previous : { top, bottom },
    );
  }, []);

  useEffect(() => {
    if (!viewport) return;

    const sync = () => measure(viewport);
    sync();

    viewport.addEventListener('scroll', sync, { passive: true });

    // ResizeObserver is not available in every test environment; the listener
    // above already keeps the common case correct, so its absence degrades to
    // "measured on scroll" rather than throwing.
    let observer: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(sync);
      observer.observe(viewport);
      // The first child is Radix's content wrapper: observing it catches a
      // sub-navigation that grew or shrank without the viewport resizing.
      if (viewport.firstElementChild) observer.observe(viewport.firstElementChild);
    }

    return () => {
      viewport.removeEventListener('scroll', sync);
      observer?.disconnect();
    };
  }, [viewport, measure]);

  return edges;
}

export function RailScroller({
  children,
  className,
  viewportClassName,
}: {
  children: ReactNode;
  className?: string;
  viewportClassName?: string;
}) {
  const [viewport, setViewport] = useState<HTMLDivElement | null>(null);
  const edges = useOverflowEdges(viewport);

  return (
    <ScrollAreaPrimitive.Root
      // `hover` keeps the rail visually quiet at rest; the edge fades below are
      // what makes hidden content discoverable, so nothing depends on the bar
      // being visible. 320ms is long enough that a short pause mid-scroll does
      // not blink the thumb away.
      type="hover"
      scrollHideDelay={320}
      className={cn('relative min-h-0', className)}
    >
      <ScrollAreaPrimitive.Viewport
        ref={setViewport}
        // Radix sets `display:table` on the viewport's content wrapper, which
        // makes a percentage-width child collapse to its intrinsic width. The
        // child selector restores block layout so nav rows still fill the rail.
        className={cn('h-full w-full [&>div]:!block', viewportClassName)}
      >
        {children}
      </ScrollAreaPrimitive.Viewport>

      <ScrollAreaPrimitive.Scrollbar
        orientation="vertical"
        // 3px thumb inside a 9px hit area: the pointer target stays usable while
        // the painted bar stays subtle. `touch-none` keeps touch scrolling on the
        // viewport rather than dragging this.
        className={cn(
          'flex w-[9px] touch-none select-none justify-center py-1.5',
          'opacity-0 transition-opacity duration-[var(--cq-duration-base,180ms)] ease-[var(--cq-ease,cubic-bezier(0.2,0,0,1))]',
          'data-[state=visible]:opacity-100',
        )}
      >
        <ScrollAreaPrimitive.Thumb className="!w-[3px] rounded-full bg-gray-950/20 transition-colors duration-[var(--cq-duration-fast,140ms)] hover:bg-gray-950/35" />
      </ScrollAreaPrimitive.Scrollbar>

      {/* Overflow affordance. Purely decorative and pointer-transparent, so it
          never intercepts a click on the nav row underneath it. */}
      <RailEdgeFade edge="top" visible={edges.top} />
      <RailEdgeFade edge="bottom" visible={edges.bottom} />
    </ScrollAreaPrimitive.Root>
  );
}

function RailEdgeFade({ edge, visible }: { edge: 'top' | 'bottom'; visible: boolean }) {
  return (
    <span
      aria-hidden="true"
      data-rail-fade={edge}
      className={cn(
        'pointer-events-none absolute inset-x-0 h-6 transition-opacity duration-[var(--cq-duration-base,180ms)] ease-[var(--cq-ease,cubic-bezier(0.2,0,0,1))]',
        edge === 'top'
          ? 'top-0 bg-gradient-to-b from-white to-transparent'
          : 'bottom-0 bg-gradient-to-t from-white to-transparent',
        visible ? 'opacity-100' : 'opacity-0',
      )}
    />
  );
}
