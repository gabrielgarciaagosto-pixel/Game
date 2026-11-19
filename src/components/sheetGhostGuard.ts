/**
 * After a touch closes a shop sheet, the browser still fires a click.
 * The sheet is gone by then, so the click hits whatever card was underneath.
 * Arm this guard in the pointerup that closes the sheet, before that click.
 */

const WINDOW_MS = 480;

let until = 0;
let listening = false;
let shield: HTMLDivElement | null = null;

function onClickCapture(event: Event) {
  if (performance.now() > until) {
    teardown();
    return;
  }
  event.preventDefault();
  event.stopPropagation();
}

function teardown() {
  if (listening) {
    document.removeEventListener('click', onClickCapture, true);
    listening = false;
  }
  shield?.remove();
  shield = null;
}

export function sheetGhostGuardActive(): boolean {
  return performance.now() <= until;
}

export function armSheetGhostGuard(ms = WINDOW_MS): void {
  until = Math.max(until, performance.now() + ms);
  if (!listening) {
    document.addEventListener('click', onClickCapture, true);
    listening = true;
  }
  if (!shield) {
    const el = document.createElement('div');
    el.setAttribute('data-catalog-ghost-shield', '');
    el.style.cssText = [
      'position:fixed',
      'inset:0',
      'z-index:460',
      'background:transparent',
      'pointer-events:auto',
      'touch-action:none',
    ].join(';');
    const stop = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
    };
    for (const name of [
      'pointerdown',
      'pointerup',
      'pointercancel',
      'mousedown',
      'mouseup',
      'click',
      'touchstart',
      'touchend',
      'touchmove',
    ]) {
      el.addEventListener(name, stop);
    }
    document.body.appendChild(el);
    shield = el;
  }
  window.setTimeout(() => {
    if (performance.now() >= until) teardown();
  }, ms + 40);
}
