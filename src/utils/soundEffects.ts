/**
 * Synthesizes a clean mortuary service intake bell using the Web Audio API
 * (Zero external MP3 assets required; works offline on Android Capacitor)
 */
export function playIntakeBell() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Fundamental bell tone + harmonic overtone
    [880, 1760].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = idx === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(idx === 0 ? 0.35 : 0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1.8);
    });
  } catch {
    // Ignore if audio context is blocked before first user tap
  }
}
