import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from './primitives';
import { border, radius, surface, text, zIndex } from './tokens';

// Accessible overlay primitives for the light dashboard: keyboard-dismissable, focus-trapped, with
// a visible backdrop. Replaces window.alert/confirm/prompt and one-off dialogs across pages.

function useFocusTrap(active: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) return;
    const node = ref.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusFirst = () => {
      if (!node) return;
      const focusable = node.querySelector<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
      );
      (focusable ?? node).focus();
    };
    // Defer to allow the portal content to mount.
    const raf = requestAnimationFrame(focusFirst);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // A Radix popper (select/combobox/dropdown menu) open inside this dialog owns Escape
        // first — closing the whole dialog because the user dismissed a dropdown would be wrong.
        // Radix portals its content into a popper wrapper, so its presence is the reliable signal.
        if (document.querySelector('[data-radix-popper-content-wrapper]')) return;
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !node) return;
      const focusables = Array.from(
        node.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), textarea, input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'),
      ).filter((el) => el.offsetParent !== null);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };

    document.addEventListener('keydown', onKeyDown, true);
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKeyDown, true);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, [active, onClose]);

  return ref;
}

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const modalWidth: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-3xl',
};

export function Modal({ open, onClose, title, description, children, footer, size = 'md' }: ModalProps) {
  const trapRef = useFocusTrap(open, onClose);
  if (!open) return null;
  return createPortal(
    <div data-cq-portal="dashboard" className={cn('fixed inset-0 flex items-end justify-center sm:items-center', zIndex.dialog)} role="presentation">
      <div className="absolute inset-0 bg-[rgba(13,17,23,0.32)] animate-in fade-in duration-fast" onClick={onClose} aria-hidden="true" />
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'relative w-full rounded-t-[14px] sm:rounded-[12px]',
          surface.overlay,
          'animate-in fade-in slide-in-from-bottom-2 duration-base ease-premium sm:zoom-in-[0.98] sm:slide-in-from-bottom-0',
          'flex max-h-[92vh] flex-col',
          modalWidth[size],
        )}
      >
        <div className={cn('flex items-start justify-between gap-4 px-5 py-3.5', border.hairlineB)}>
          <div className="min-w-0">
            <h2 className={text.cardTitle}>{title}</h2>
            {description ? <p className={cn('mt-0.5', text.body)}>{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className={cn('shrink-0 p-1.5 text-[var(--cq-fg-subtle)] transition-colors duration-fast hover:bg-[var(--cq-hover)] hover:text-[var(--cq-fg)]', radius.sm)}
            aria-label="Schließen"
          >
            <X size={16} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer ? <div className={cn('flex flex-wrap items-center justify-end gap-2 px-5 py-3.5', border.hairlineT)}>{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}

interface SlideOverProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: 'md' | 'lg' | 'xl';
}

const slideWidth: Record<NonNullable<SlideOverProps['width']>, string> = {
  md: 'sm:max-w-lg', lg: 'sm:max-w-2xl', xl: 'sm:max-w-4xl',
};

export function SlideOver({ open, onClose, title, description, children, footer, width = 'lg' }: SlideOverProps) {
  const trapRef = useFocusTrap(open, onClose);
  if (!open) return null;
  return createPortal(
    <div data-cq-portal="dashboard" className={cn('fixed inset-0 flex justify-end', zIndex.dialog)} role="presentation">
      <div className="absolute inset-0 bg-[rgba(13,17,23,0.32)] animate-in fade-in duration-fast" onClick={onClose} aria-hidden="true" />
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'relative flex h-full w-full flex-col bg-[var(--cq-canvas)] shadow-[var(--cq-elev-3)]',
          'animate-in slide-in-from-right duration-base ease-premium',
          slideWidth[width],
        )}
      >
        <div className={cn('flex items-start justify-between gap-4 bg-[var(--cq-surface)] px-5 py-3.5', border.hairlineB)}>
          <div className="min-w-0">
            <h2 className={text.cardTitle}>{title}</h2>
            {description ? <p className={cn('mt-0.5', text.body)}>{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className={cn('shrink-0 p-1.5 text-[var(--cq-fg-subtle)] transition-colors duration-fast hover:bg-[var(--cq-hover)] hover:text-[var(--cq-fg)]', radius.sm)}
            aria-label="Schließen"
          >
            <X size={16} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer ? <div className={cn('flex flex-wrap items-center justify-end gap-2 bg-[var(--cq-surface)] px-5 py-3.5', border.hairlineT)}>{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'default' | 'danger';
}

export function ConfirmDialog({
  open, onClose, onConfirm, title, message, confirmLabel = 'Bestätigen', cancelLabel = 'Abbrechen', tone = 'default',
}: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false);
  const run = useCallback(async () => {
    setBusy(true);
    try { await onConfirm(); } finally { setBusy(false); }
  }, [onConfirm]);

  return (
    <Modal
      open={open}
      onClose={busy ? () => {} : onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>{cancelLabel}</Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={() => void run()} loading={busy}>{confirmLabel}</Button>
        </>
      }
    >
      <div className="flex gap-3">
        {tone === 'danger' ? (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
            <AlertTriangle size={16} aria-hidden="true" />
          </span>
        ) : null}
        <div className={text.body}>{message}</div>
      </div>
    </Modal>
  );
}
