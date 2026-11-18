import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

/**
 * Full-screen shop sheet. The backdrop swallows every pointer and touch
 * outside the card. It does not close. The only exit is a button inside.
 */
export const CatalogSheet: React.FC<{
  children: React.ReactNode;
  /** Higher sheets sit on top of an already-open detail. */
  z?: number;
}> = ({ children, z = 200 }) => {
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = backdropRef.current;
    if (!el) return;
    const swallow = (event: Event) => {
      if (event.target !== el) return;
      event.preventDefault();
      event.stopPropagation();
    };
    const opts: AddEventListenerOptions = { capture: true, passive: false };
    const names = [
      'pointerdown',
      'pointerup',
      'pointercancel',
      'touchstart',
      'touchend',
      'touchmove',
      'click',
    ] as const;
    for (const name of names) el.addEventListener(name, swallow, opts);
    return () => {
      for (const name of names) el.removeEventListener(name, swallow, opts);
    };
  }, []);

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
    >
      <div
        data-catalog-card
        className="relative z-10 w-full max-w-md max-h-[86vh] overflow-y-auto"
        style={{ pointerEvents: 'auto', touchAction: 'manipulation' }}
        onPointerDown={(event) => event.stopPropagation()}
        onPointerUp={(event) => event.stopPropagation()}
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
