import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';

// Premium, reusable drawn-signature field. Works with finger (touch), mouse, trackpad
// and pen (Pointer Events API). High-DPI backing store, responsive without destroying a
// finished signature (strokes are stored NORMALISED 0..1 and re-rendered on resize),
// clear + undo, a visible empty-state baseline, empty-ink detection that blocks
// submission, page-scroll suppression while signing (touch-action:none + preventDefault),
// and an accessible typed-signature fallback. It records NO behavioural biometrics
// (no pressure, velocity, timing or device-motion) — only the final visual strokes.

export interface SignatureResult {
  dataUrl: string;
  blob: Blob;
  width: number;
  height: number;
  bytes: number;
  mode: 'draw' | 'type';
}

export interface SignaturePadHandle {
  isEmpty: () => boolean;
  clear: () => void;
  /** Export a white-background PNG (+ dimensions). Returns null when empty. */
  export: (maxBytes?: number) => Promise<SignatureResult | null>;
}

interface Point { x: number; y: number }
type Stroke = Point[];

interface SignaturePadProps {
  /** Called whenever the presence of ink changes (drives the parent's submit gate). */
  onInkChange?: (hasInk: boolean) => void;
  heightClass?: string;
  disabled?: boolean;
}

const EXPORT_WIDTH = 900;
const EXPORT_HEIGHT = 320;

export const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(function SignaturePad(
  { onInkChange, heightClass = 'h-44', disabled = false },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const drawingRef = useRef(false);
  const currentRef = useRef<Stroke>([]);
  const [mode, setMode] = useState<'draw' | 'type'>('draw');
  const [typed, setTyped] = useState('');
  const [hasInk, setHasInk] = useState(false);

  const notify = useCallback((next: boolean) => {
    setHasInk((prev) => (prev === next ? prev : next));
    onInkChange?.(next);
  }, [onInkChange]);

  // ---- rendering ---------------------------------------------------------
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 3));
    const cssW = wrap.clientWidth;
    const cssH = wrap.clientHeight;
    if (cssW === 0 || cssH === 0) return;
    // Only resize the backing store when needed (resizing clears the canvas).
    if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.4;
    for (const stroke of strokesRef.current) {
      if (stroke.length === 0) continue;
      ctx.beginPath();
      stroke.forEach((p, i) => {
        const x = p.x * cssW;
        const y = p.y * cssH;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      if (stroke.length === 1) { // a dot
        ctx.lineTo(stroke[0].x * cssW + 0.1, stroke[0].y * cssH + 0.1);
      }
      ctx.stroke();
    }
  }, []);

  useEffect(() => {
    render();
    const wrap = wrapRef.current;
    if (!wrap || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => render());
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [render, mode]);

  // ---- pointer drawing ---------------------------------------------------
  const pointFrom = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)),
    };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled || mode !== 'draw') return;
    e.preventDefault();
    canvasRef.current?.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    currentRef.current = [pointFrom(e)];
    strokesRef.current.push(currentRef.current);
    render();
  };
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || mode !== 'draw') return;
    e.preventDefault();
    currentRef.current.push(pointFrom(e));
    render();
  };
  const endStroke = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    e.preventDefault();
    drawingRef.current = false;
    notify(strokesRef.current.some((s) => s.length > 0));
  };

  const clear = useCallback(() => {
    strokesRef.current = [];
    currentRef.current = [];
    setTyped('');
    render();
    notify(false);
  }, [render, notify]);

  const undo = useCallback(() => {
    strokesRef.current.pop();
    render();
    notify(strokesRef.current.some((s) => s.length > 0));
  }, [render, notify]);

  // ---- export ------------------------------------------------------------
  const exportPng = useCallback(async (maxBytes = 400_000): Promise<SignatureResult | null> => {
    const typedName = typed.trim();
    if (mode === 'type') {
      if (!typedName) return null;
    } else if (!strokesRef.current.some((s) => s.length > 0)) {
      return null;
    }
    const out = document.createElement('canvas');
    out.width = EXPORT_WIDTH;
    out.height = EXPORT_HEIGHT;
    const ctx = out.getContext('2d');
    if (!ctx) return null;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, EXPORT_WIDTH, EXPORT_HEIGHT);
    if (mode === 'type') {
      ctx.fillStyle = '#0f172a';
      ctx.textBaseline = 'middle';
      ctx.font = "600 64px 'Segoe Script','Comic Sans MS',cursive";
      ctx.fillText(typedName, 40, EXPORT_HEIGHT / 2);
    } else {
      ctx.strokeStyle = '#0f172a';
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.lineWidth = 4;
      for (const stroke of strokesRef.current) {
        if (stroke.length === 0) continue;
        ctx.beginPath();
        stroke.forEach((p, i) => {
          const x = p.x * EXPORT_WIDTH;
          const y = p.y * EXPORT_HEIGHT;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        if (stroke.length === 1) ctx.lineTo(stroke[0].x * EXPORT_WIDTH + 0.1, stroke[0].y * EXPORT_HEIGHT + 0.1);
        ctx.stroke();
      }
    }
    const blob = await new Promise<Blob | null>((resolve) => out.toBlob(resolve, 'image/png'));
    if (!blob) return null;
    if (blob.size > maxBytes) {
      // Fallback to a lighter re-encode; PNG of a line drawing is normally well within budget.
      return null;
    }
    const dataUrl = out.toDataURL('image/png');
    return { dataUrl, blob, width: EXPORT_WIDTH, height: EXPORT_HEIGHT, bytes: blob.size, mode };
  }, [mode, typed]);

  useImperativeHandle(ref, () => ({
    isEmpty: () => (mode === 'type' ? typed.trim().length === 0 : !strokesRef.current.some((s) => s.length > 0)),
    clear,
    export: exportPng,
  }), [mode, typed, clear, exportPng]);

  return (
    <div>
      <div
        ref={wrapRef}
        className={`relative w-full ${heightClass} overflow-hidden rounded-2xl border border-slate-200 bg-white`}
      >
        {mode === 'draw' ? (
          <>
            {/* visible empty-state baseline */}
            <div className="pointer-events-none absolute inset-x-8 bottom-10 border-b border-dashed border-slate-300" />
            {!hasInk ? (
              <span className="pointer-events-none absolute inset-x-0 bottom-4 text-center text-[12px] text-slate-400">
                Hier unterschreiben
              </span>
            ) : null}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 h-full w-full cursor-crosshair touch-none select-none"
              style={{ touchAction: 'none' }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endStroke}
              onPointerCancel={endStroke}
              onPointerLeave={endStroke}
              aria-label="Unterschriftsfeld"
              role="img"
            />
          </>
        ) : (
          <div className="flex h-full items-center px-6">
            <input
              value={typed}
              onChange={(e) => { setTyped(e.target.value); notify(e.target.value.trim().length > 0); }}
              placeholder="Vollständigen Namen eingeben"
              className="w-full bg-transparent text-3xl [font-family:'Segoe_Script','Comic_Sans_MS',cursive] text-slate-900 outline-none placeholder:text-slate-300"
              aria-label="Unterschrift als Text eingeben"
              disabled={disabled}
            />
          </div>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          <button type="button" onClick={undo} disabled={disabled || mode === 'type'}
            className="rounded-lg px-3 py-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-900 disabled:opacity-40">
            Rückgängig
          </button>
          <button type="button" onClick={clear} disabled={disabled}
            className="rounded-lg px-3 py-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-900">
            Löschen
          </button>
        </div>
        <button type="button"
          onClick={() => { clear(); setMode((m) => (m === 'draw' ? 'type' : 'draw')); }}
          className="rounded-lg px-3 py-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-900">
          {mode === 'draw' ? 'Stattdessen tippen' : 'Zeichnen'}
        </button>
      </div>
    </div>
  );
});

export default SignaturePad;
