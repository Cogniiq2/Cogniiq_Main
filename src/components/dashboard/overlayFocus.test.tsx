// Focus ownership inside Modal / SlideOver.
//
// Both overlays move focus into themselves when they open — correct, and required for
// keyboard and screen-reader users. The bug this file pins is what that must NOT do:
// take focus away from someone who is already typing.
//
// Two independent paths used to do exactly that, and each of them silently dropped input:
//
//   1. The trap's effect listed `onClose` as a dependency. Every caller passes an inline
//      arrow (`onClose={() => setOpen(false)}`), so its identity changes on EVERY render of
//      the parent. Any unrelated re-render behind an open dialog — a background reload
//      finishing, a toast appearing — therefore tore the effect down, and the teardown
//      restores focus to whatever was focused before the dialog opened.
//
//   2. The initial focus runs a frame late (`requestAnimationFrame`) so the portal can
//      mount. The first focusable node in a Modal is the "Schließen" button, so if the
//      owner reached a field before that frame arrived, the caret was yanked to the close
//      button and the rest of their keystrokes went nowhere.
//
// Symptom in the wild: typing a folder name and getting a folder called "2".
import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// Imported from the overlays module directly rather than the dashboard barrel: the barrel
// pulls in the Supabase client, which this test has no business booting.
import { Modal, SlideOver } from '@/components/dashboard/overlays';

/**
 * Hold the deferred initial-focus callback so a test can decide when the frame lands —
 * before or after the user reaches a field. Real timing is a race; this makes it a choice.
 */
function captureFrames() {
  const frames: FrameRequestCallback[] = [];
  let requested = 0;
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { frames.push(cb); requested += 1; return requested; });
  vi.stubGlobal('cancelAnimationFrame', () => {});
  return {
    run: () => { const queued = [...frames]; frames.length = 0; queued.forEach((cb) => cb(0)); },
    /** How many times the trap has armed its deferred initial focus. */
    requested: () => requested,
  };
}

afterEach(() => { vi.unstubAllGlobals(); });

describe.each([
  { name: 'Modal', Overlay: Modal },
  { name: 'SlideOver', Overlay: SlideOver },
])('$name focus ownership', ({ Overlay }) => {
  it('moves focus into the dialog when nothing inside it is focused yet', () => {
    const frames = captureFrames();
    render(<Overlay open onClose={() => {}} title="Titel"><input aria-label="Feld" /></Overlay>);

    frames.run();

    const dialog = screen.getByRole('dialog');
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it('does NOT steal focus from a field the user already reached', () => {
    const frames = captureFrames();
    render(<Overlay open onClose={() => {}} title="Titel"><input aria-label="Feld" /></Overlay>);

    // The owner clicks into the field before the deferred frame arrives.
    const field = screen.getByLabelText('Feld');
    field.focus();
    expect(document.activeElement).toBe(field);

    frames.run();

    expect(document.activeElement).toBe(field);
  });

  it('keeps focus in the field when the parent re-renders behind the dialog', () => {
    const frames = captureFrames();
    // Each render passes a NEW inline arrow, exactly as every caller in the app does.
    const view = render(<Overlay open onClose={() => {}} title="Titel"><input aria-label="Feld" /></Overlay>);
    frames.run();

    const field = screen.getByLabelText('Feld');
    field.focus();

    // A background reload finishing is indistinguishable from this: same props, new identities.
    view.rerender(<Overlay open onClose={() => {}} title="Titel"><input aria-label="Feld" /></Overlay>);
    frames.run();

    expect(document.activeElement).toBe(field);
  });

  it('arms the trap once per open, not once per parent render', () => {
    // The direct, countable consequence of keying the effect on `active` alone. With `onClose`
    // in the dependency list every parent render tore the trap down and re-armed it, and each
    // teardown restored focus to the opener — which is what pulled the caret out of a field
    // mid-typing. One arming per open is the invariant; the focus assertions above are the
    // symptom, this is the mechanism.
    const frames = captureFrames();
    const view = render(<Overlay open onClose={() => {}} title="Titel"><input aria-label="Feld" /></Overlay>);
    expect(frames.requested()).toBe(1);

    // Same props, fresh inline arrows — exactly what a re-render behind the dialog produces.
    view.rerender(<Overlay open onClose={() => {}} title="Titel"><input aria-label="Feld" /></Overlay>);
    view.rerender(<Overlay open onClose={() => {}} title="Titel"><input aria-label="Feld" /></Overlay>);

    expect(frames.requested()).toBe(1);
  });

  it('still restores focus to the opener when the dialog actually closes', () => {
    const frames = captureFrames();
    const opener = document.createElement('button');
    document.body.appendChild(opener);
    opener.focus();

    const view = render(<Overlay open onClose={() => {}} title="Titel"><input aria-label="Feld" /></Overlay>);
    frames.run();
    expect(document.activeElement).not.toBe(opener);

    view.rerender(<Overlay open={false} onClose={() => {}} title="Titel"><input aria-label="Feld" /></Overlay>);

    expect(document.activeElement).toBe(opener);
    opener.remove();
  });
});
