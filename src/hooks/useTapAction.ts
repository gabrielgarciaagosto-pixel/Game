import { useCallback, useRef } from 'react';
import { audioManager } from '../utils/audioManager';

type TapOptions = {
  /** Cancel tap if pointer moves farther than this (px). Default 10. */
  moveThresholdPx?: number;
  /** Cancel tap if held longer than this. Default 750ms. */
  maxDurationMs?: number;
};

/**
 * Fire `onTap` only on a real tap: pointerup with little movement and short hold.
 * Use instead of onPointerDown for buttons inside scrollable lists so a finger
 * scroll does not activate / purchase under the touch.
 */
export function useTapAction(onTap: () => void, options?: TapOptions) {
  const moveThresholdPx = options?.moveThresholdPx ?? 10;
  const maxDurationMs = options?.maxDurationMs ?? 750;
  const onTapRef = useRef(onTap);
  onTapRef.current = onTap;
  const startRef = useRef<{
    x: number;
    y: number;
    t: number;
    id: number;
  } | null>(null);
  /** Suppress the synthetic click that follows a handled pointerup. */
  const suppressClickRef = useRef(false);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    startRef.current = {
      x: e.clientX,
      y: e.clientY,
      t: performance.now(),
      id: e.pointerId,
    };
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const s = startRef.current;
      if (!s || e.pointerId !== s.id) return;
      const dx = e.clientX - s.x;
      const dy = e.clientY - s.y;
      if (dx * dx + dy * dy > moveThresholdPx * moveThresholdPx) {
        startRef.current = null;
      }
    },
    [moveThresholdPx]
  );

  const finish = useCallback(
    (e: React.PointerEvent, cancelled: boolean) => {
      const s = startRef.current;
      startRef.current = null;
      if (cancelled || !s || e.pointerId !== s.id) return;
      if (performance.now() - s.t > maxDurationMs) return;
      const dx = e.clientX - s.x;
      const dy = e.clientY - s.y;
      if (dx * dx + dy * dy > moveThresholdPx * moveThresholdPx) return;
      suppressClickRef.current = true;
      audioManager.playUiClick('tick');
      onTapRef.current();
    },
    [maxDurationMs, moveThresholdPx]
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => finish(e, false),
    [finish]
  );

  const onPointerCancel = useCallback((e: React.PointerEvent) => {
    if (startRef.current?.id === e.pointerId) startRef.current = null;
  }, []);

  const onClick = useCallback((e: React.MouseEvent) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    // Keyboard / accessibility activation (no prior pointer sequence).
    audioManager.playUiClick('tick');
    onTapRef.current();
  }, []);

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onClick,
  };
}
