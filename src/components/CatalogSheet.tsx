import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { armSheetGhostGuard } from './sheetGhostGuard';

/**
 * Full-screen shop sheet. The backdrop swallows every pointer and touch
 * outside the card. It does not close. The only exit is a button inside.
 * Closing arms a short click guard so the tap cannot fall through onto
 * the catalog card that was underneath.
 */
export const CatalogSheet: React.FC<{
  children: React.ReactNode;
  /** Higher sheets sit on top of an already-open detail. */
  z?: number;
}> = ({ children, z = 200 }) => {
  const backdropRef = useRef<HTMLDivElement>(null);
  const openedAt = useRef(0);

  useLayoutEffect(() => {
    openedAt.current = performance.now();
    return () => {
      // StrictMode's throwaway unmount is immediate. A real close is not.
      if (performance.now() - openedAt.current < 50) return;
      armSheetGhostGuard();
    };
  }, []);

  useEffect(() => {
    const el = backdropRef.current;
    if (!el) return;
    const swallow = (event: Event) => {
      if (event.target !== el) return;
      event.preventDefault();
      event.stopPropagation();
    };
    const armIfClosing = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (!target.closest('[data-catalog-back], [data-catalog-dismiss]')) return;
      armSheetGhostGuard();
    };
    const opts: AddEventListenerOptions = { capture: true, passive: false };
    const names = [
      'pointerdown',
      'pointerup',
      'pointercancel',
      'mousedown',
      'mouseup',
      'touchstart',
      'touchend',
      'touchmove',
      'click',
    ] as const;
    for (const name of names) el.addEventListener(name, swallow, opts);
    el.addEventListener('pointerup', armIfClosing, true);
    el.addEventListener('click', armIfClosing, true);
    return () => {
      for (const name of names) el.removeEventListener(name, swallow, opts);
      el.removeEventListener('pointerup', armIfClosing, true);
      el.removeEventListener('click', armIfClosing, true);
    };
  }, []);

  const blockBackdrop = (event: React.SyntheticEvent) => {
    if (event.target !== event.currentTarget) return;
    event.preventDefault();
    event.stopPropagation();
  };

  return createPortal(
    <div
      ref={backdropRef}
      data-catalog-sheet
      className="fixed inset-0 flex items-end justify-center bg-black/80"
      style={{
        zIndex: z,
        pointerEvents: 'auto',
        touchAction: 'none',
        paddingTop: '1rem',
        paddingLeft: 'max(1rem, env(safe-area-inset-left))',
        paddingRight: 'max(1rem, env(safe-area-inset-right))',
        paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))',
      }}
      onPointerDown={blockBackdrop}
      onPointerUp={blockBackdrop}
      onMouseDown={blockBackdrop}
      onMouseUp={blockBackdrop}
      onClick={blockBackdrop}
      onTouchStart={blockBackdrop}
      onTouchEnd={blockBackdrop}
    >
      <div
        data-catalog-card
        className="relative z-10 w-full max-w-md max-h-[86vh] overflow-y-auto"
        style={{ pointerEvents: 'auto', touchAction: 'manipulation' }}
        onPointerDown={(event) => event.stopPropagation()}
        onPointerUp={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
        onMouseUp={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
        onTouchStart={(event) => event.stopPropagation()}
        onTouchEnd={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};
