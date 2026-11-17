/**
 * Urn-processor extractor.
 *
 * The files in the zip were named backwards. The 33s clip spins up from
 * quiet to full speed in about four seconds, then sits at that speed.
 * The 26s clip is already at that speed the whole way. The wavs here are
 * named for the sound: startup is the spin-up, running is the steady loop.
 *
 * Startup starts on the switch press. At 4s, when the motor is up to
 * speed, it crossfades into the running loop. Off fades out in 80ms.
 * Level and mute follow the interface bus, the same gate as UI clicks.
 */
import { audioManager } from '../utils/audioManager';

const CLIPS = {
  startup: '/audio/extractor/extractor-startup.wav',
  running: '/audio/extractor/extractor-running.wav',
} as const;

type ClipId = keyof typeof CLIPS;

/** Spin-up reaches the running level here. The wav is a little longer so the fade has sound under it. */
const HANDOFF_SEC = 4;
const XFADE_SEC = 0.12;
const OFF_FADE_SEC = 0.08;

class ExtractorSfx {
  private buffers = new Map<ClipId, AudioBuffer>();
  private loading: Promise<void> | null = null;
  private generation = 0;
  private running = false;
  private stopping = false;
  private master: GainNode | null = null;
  private sources: AudioBufferSourceNode[] = [];
  private watch: number | null = null;

  preload(): Promise<void> {
    if (this.buffers.size === 2) return Promise.resolve();
    if (this.loading) return this.loading;
    this.loading = this.loadAll().catch((err: unknown) => {
      this.loading = null;
      throw err;
    });
    return this.loading;
  }

  /** Switch on. A second call while it is already going does nothing. */
  start(): void {
    if (this.running) return;
    this.running = true;
    this.stopping = false;
    const gen = ++this.generation;
    const go = () => {
      if (gen !== this.generation || !this.running) return;
      this.play(gen);
    };
    if (this.buffers.size < 2) {
      void this.preload().then(go).catch(() => undefined);
      return;
    }
    const ctx = audioManager.outputContext();
    if (ctx.state !== 'running') {
      void ctx.resume().then(go);
      return;
    }
    go();
  }

  /** Switch off, or leave the processor. The motor does not ring out. */
  stop(): void {
    if (!this.running && !this.master) return;
    this.running = false;
    this.generation += 1;
    this.fadeOut();
  }

  private async loadAll(): Promise<void> {
    const ctx = audioManager.outputContext();
    await Promise.all(
      (Object.keys(CLIPS) as ClipId[]).map(async (id) => {
        if (this.buffers.has(id)) return;
        const res = await fetch(CLIPS[id]);
        if (!res.ok) throw new Error(`extractor sfx ${id} ${res.status}`);
        const raw = await res.arrayBuffer();
        const buffer = await ctx.decodeAudioData(raw.slice(0));
        this.buffers.set(id, buffer);
      })
    );
  }

  private level(): number {
    if (audioManager.isInterfaceMuted()) return 0;
    return audioManager.getSfxVolume();
  }

  private play(gen: number): void {
    if (gen !== this.generation || !this.running) return;
    const startup = this.buffers.get('startup');
    const loop = this.buffers.get('running');
    if (!startup || !loop) return;
    const ctx = audioManager.outputContext();
    if (ctx.state !== 'running') {
      void ctx.resume().then(() => this.play(gen));
      return;
    }
    this.cutNow();
    const t0 = ctx.currentTime + 0.005;
    const handoffAt = Math.min(HANDOFF_SEC, Math.max(0.2, startup.duration - XFADE_SEC));
    const handoff = t0 + handoffAt;

    const master = ctx.createGain();
    master.gain.setValueAtTime(this.level(), t0);
    master.connect(ctx.destination);
    this.master = master;

    const steps = 24;
    const fadeOut = new Float32Array(steps);
    const fadeIn = new Float32Array(steps);
    for (let i = 0; i < steps; i += 1) {
      const t = i / (steps - 1);
      fadeOut[i] = Math.cos((t * Math.PI) / 2);
      fadeIn[i] = Math.sin((t * Math.PI) / 2);
    }
    const startupGain = ctx.createGain();
    startupGain.gain.setValueAtTime(1, t0);
    startupGain.gain.setValueCurveAtTime(fadeOut, handoff, XFADE_SEC);
    startupGain.connect(master);

    const loopGain = ctx.createGain();
    loopGain.gain.setValueAtTime(0, t0);
    loopGain.gain.setValueCurveAtTime(fadeIn, handoff, XFADE_SEC);
    loopGain.connect(master);

    const startupSrc = ctx.createBufferSource();
    startupSrc.buffer = startup;
    startupSrc.connect(startupGain);
    startupSrc.start(t0);
    startupSrc.stop(handoff + XFADE_SEC + 0.02);

    const loopSrc = ctx.createBufferSource();
    loopSrc.buffer = loop;
    loopSrc.loop = true;
    loopSrc.connect(loopGain);
    loopSrc.start(handoff);

    this.sources = [startupSrc, loopSrc];
    this.ensureWatch();
  }

  private fadeOut(): void {
    const master = this.master;
    const sources = this.sources;
    if (!master) {
      this.cutNow();
      return;
    }
    this.stopping = true;
    const ctx = audioManager.outputContext();
    const now = ctx.currentTime;
    const gain = master.gain;
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(gain.value, now);
    gain.linearRampToValueAtTime(0, now + OFF_FADE_SEC);
    const stopAt = now + OFF_FADE_SEC + 0.02;
    for (const source of sources) {
      try {
        source.stop(stopAt);
      } catch {
        /* already stopped */
      }
    }
    window.setTimeout(() => {
      if (this.master === master) this.cutNow();
    }, (OFF_FADE_SEC + 0.05) * 1000);
  }

  private cutNow(): void {
    for (const source of this.sources) {
      try {
        source.stop();
      } catch {
        /* already stopped */
      }
      try {
        source.disconnect();
      } catch {
        /* ignore */
      }
    }
    this.sources = [];
    if (this.master) {
      try {
        this.master.disconnect();
      } catch {
        /* ignore */
      }
      this.master = null;
    }
    this.stopping = false;
    if (!this.running) this.clearWatch();
  }

  private ensureWatch(): void {
    if (this.watch != null) return;
    this.watch = window.setInterval(() => this.tick(), 40);
  }

  private clearWatch(): void {
    if (this.watch == null) return;
    window.clearInterval(this.watch);
    this.watch = null;
  }

  private tick(): void {
    if (!this.running && !this.master) {
      this.clearWatch();
      return;
    }
    if (this.stopping || !this.master) return;
    const now = audioManager.outputContext().currentTime;
    this.master.gain.setValueAtTime(this.level(), now);
  }
}

export const extractorSfx = new ExtractorSfx();
