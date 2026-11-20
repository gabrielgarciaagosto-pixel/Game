import { useEffect } from 'react';

/**
 * Mark a bottom sheet as open so the FILES button hides.
 * The button is painted above the computer, so a sheet inside the
 * shop cannot cover it. Hiding it keeps Confirm, Cancel, and Purchase clear.
 */
export function useSheetOpen(active = true): void {
  useEffect(() => {
    if (!active) return;
    const el = document.documentElement;
    const next = Number(el.dataset.sheetOpen || '0') + 1;
    el.dataset.sheetOpen = String(next);
    return () => {
      const left = Number(document.documentElement.dataset.sheetOpen || '1') - 1;
      if (left <= 0) delete document.documentElement.dataset.sheetOpen;
      else document.documentElement.dataset.sheetOpen = String(left);
    };
  }, [active]);
}
