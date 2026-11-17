/**
 * Cremulator bed. This is the old crematory running loop, moved here
 * until a processor recording exists. It follows the interface slider
 * and the interface mute, the same gate as the extractor.
 */
import { audioManager } from '../utils/audioManager';

const URL = '/audio/processor/cremulator-running.wav';
const OFF_FADE_SEC = 0.12;

class CremulatorSfx {
  private buffer: AudioBuffer | null = null;
  private loading: Promise<void> | null = null;
  private generation = 0;
  private running = false;
  private stopping = false;
  private master: GainNode | null = null;
  private source: AudioBufferSourceNode | null = null;
  private watch: number | null = null;

  preload(): Promise<void> {
    if (this.buffer) return Promise.resolve();
    if (this.loading) return this.loading;
    this.loading = this.load().catch((err: unknown) => {
      this.loading = null;
      throw err;
    });
    return this.loading;
  }

  /** Mill engaged. A second call while it is already spinning does nothing. */
  start(): void {
    if (this.running) return;
    this.running = true;
    this.stopping = false;
    const gen = ++this.generation;
    const go = () => {
      if (gen !== this.generation || !this.running) return;
      this.play(gen);
    };
    if (!this.buffer) {
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

  /** Emergency stop, mill finished, or the player left the processor. */
  stop(): void {
    if (!this.running && !this.master) return;
    this.running = false;
    this.generation += 1;
    this.fadeOut();
  }

  private async load(): Promise<void> {
    const ctx = audioManager.outputContext();
    const res = await fetch(URL);
    if (!res.ok) throw new Error(`cremulator sfx ${res.status}`);
    const raw = await res.arrayBuffer();
    this.buffer = await ctx.decodeAudioData(raw.slice(0));
  }

  private level(): number {
    if (audioManager.isInterfaceMuted()) return 0;
    return audioManager.getSfxVolume();
  }

  private play(gen: number): void {
    if (gen !== this.generation || !this.running || !this.buffer) return;
    const ctx = audioManager.outputContext();
    if (ctx.state !== 'running') {
      void ctx.resume().then(() => this.play(gen));
      return;
    }
    this.cutNow();
    const t0 = ctx.currentTime + 0.01;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0, t0);
    master.gain.linearRampToValueAtTime(this.level(), t0 + 0.08);
    master.connect(ctx.destination);
    this.master = master;
    const source = ctx.createBufferSource();
    source.buffer = this.buffer;
    source.loop = true;
    source.connect(master);
    source.start(t0);
    this.source = source;
    this.ensureWatch();
  }

  private fadeOut(): void {
    const master = this.master;
    const source = this.source;
    if (!master || !source) {
      this.cutNow();
      return;
    }
    this.stopping = true;
    const ctx = audioManager.outputContext();
    const now = ctx.currentTime;
    const gain = master.gain;
    gain.cancelScheduledValues(now);
    const current = gain.value;
    gain.setValueAtTime(current, now);
    gain.linearRampToValueAtTime(0, now + OFF_FADE_SEC);
    try {
      source.stop(now + OFF_FADE_SEC + 0.02);
    } catch {
      /* already stopped */
    }
    window.setTimeout(() => {
      if (this.master === master) this.cutNow();
    }, (OFF_FADE_SEC + 0.05) * 1000);
  }

  private cutNow(): void {
    if (this.source) {
      try {
        this.source.stop();
      } catch {
        /* already stopped */
      }
      try {
        this.source.disconnect();
      } catch {
        /* ignore */
      }
      this.source = null;
    }
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

export const cremulatorSfx = new CremulatorSfx();
