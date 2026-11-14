/**
 * Soft ash-pour bed — filtered noise with GainNode crossfade in/out.
 * Matches crematory polish without a separate asset file.
 */
let pourCtx: AudioContext | null = null;
let pourGain: GainNode | null = null;
let pourSource: AudioBufferSourceNode | null = null;
const POUR_CROSSFADE_MS = 280;

function getPourContext(): AudioContext {
  if (pourCtx) return pourCtx;
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;
  pourCtx = new Ctor();
  return pourCtx;
}

function makeAshNoiseBuffer(ctx: AudioContext, seconds = 1.5): AudioBuffer {
  const rate = ctx.sampleRate;
  const buffer = ctx.createBuffer(1, Math.floor(rate * seconds), rate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < data.length; i++) {
    // Soft brownish noise for ash grain
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    data[i] = last * 0.55;
  }
  return buffer;
}

/** Fade in a looping ash pour bed (call while tilting). */
export function startAshPourSfx(volume = 0.22) {
  try {
    const ctx = getPourContext();
    if (ctx.state === 'suspended') void ctx.resume();
    const t = ctx.currentTime;
    const fade = POUR_CROSSFADE_MS / 1000;
    if (!pourGain) {
      pourGain = ctx.createGain();
      pourGain.gain.setValueAtTime(0.0001, t);
      pourGain.connect(ctx.destination);
    }
    if (!pourSource) {
      const source = ctx.createBufferSource();
      source.buffer = makeAshNoiseBuffer(ctx);
      source.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 780;
      filter.Q.value = 0.7;
      source.connect(filter);
      filter.connect(pourGain);
      source.start(t);
      pourSource = source;
    }
    const g = pourGain.gain;
    g.cancelScheduledValues(t);
    g.setValueAtTime(Math.max(0.0001, g.value), t);
    g.linearRampToValueAtTime(Math.max(0.0001, volume), t + fade);
  } catch {
    /* ignore */
  }
}

/** Crossfade pour SFX out. */
export function stopAshPourSfx() {
  try {
    if (!pourCtx || !pourGain) return;
    const t = pourCtx.currentTime;
    const fade = POUR_CROSSFADE_MS / 1000;
    const g = pourGain.gain;
    g.cancelScheduledValues(t);
    g.setValueAtTime(Math.max(0.0001, g.value), t);
    g.linearRampToValueAtTime(0.0001, t + fade);
  } catch {
    /* ignore */
  }
}

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
