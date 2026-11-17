/**
 * Crematory rake and brush clips.
 * Sweep loops stay tied to the tool: stop() cuts them, they do not ring out.
 * A bone-fall, once started, plays through even if the tool stops.
 * Level and mute follow the interface bus (the same gate as UI clicks).
 */
import { audioManager } from '../utils/audioManager';
import type { FallClip, SweepClip } from './crematoryToolSfxPolicy';

const CLIPS = {
  dry: '/audio/crematory/ironrake-retort-sweep-dry.wav',
  bones: '/audio/crematory/ironrake-bones-sweep.wav',
  short: '/audio/crematory/sweep-bones-fall.wav',
  long: '/audio/crematory/long-sweep-bones-fall.wav',
} as const;

type ClipId = keyof typeof CLIPS;

/** No pointer sample for this long means the tool is sitting still. */
const SWEEP_HOLD_MS = 120;

type Voice = {
  source: AudioBufferSourceNode;
  gain: GainNode;
};

class CrematoryToolSfx {
  private buffers = new Map<ClipId, AudioBuffer>();
  private loading: Promise<void> | null = null;
  private sweep: (Voice & { kind: SweepClip }) | null = null;
  private wanted: SweepClip | null = null;
  private lastMove = 0;
  private falls: Voice[] = [];
  private generation = 0;
  private watch: number | null = null;

  preload(): Promise<void> {
    if (this.buffers.size === 4) return Promise.resolve();
    if (this.loading) return this.loading;
    this.loading = this.loadAll().catch((err: unknown) => {
      this.loading = null;
      throw err;
    });
    return this.loading;
  }

  /**
   * `null` cuts the sweep on this sample. A clip keeps the current loop
   * if it is already that clip, and swaps immediately if it is the other.
   */
  setSweep(kind: SweepClip | null): void {
    if (kind == null) {
      this.wanted = null;
      this.cutSweep();
      return;
    }
    this.lastMove = performance.now();
    this.wanted = kind;
    if (!this.audible()) {
      this.cutSweep();
      return;
    }
    this.ensureWatch();
    if (this.sweep?.kind === kind) {
      this.applyGain(this.sweep.gain);
      return;
    }
    if (!this.buffers.has(kind)) {
      void this.preload()
        .then(() => {
          if (this.wanted === kind) this.startLoop(kind);
        })
        .catch(() => undefined);
      return;
    }
    this.startLoop(kind);
  }

  /** One-shot. Releasing the tool does not stop it. Leaving the room does. */
  playFall(which: FallClip): void {
    const gen = this.generation;
    const start = () => {
      if (gen !== this.generation || !this.audible()) return;
      this.startFall(which);
    };
    if (this.buffers.has(which)) {
      start();
      return;
    }
    void this.preload().then(start).catch(() => undefined);
  }

  stopAll(): void {
    this.generation += 1;
    this.wanted = null;
    this.cutSweep();
    this.cutFalls();
    this.clearWatch();
  }

  private async loadAll(): Promise<void> {
    const ctx = audioManager.outputContext();
    await Promise.all(
      (Object.keys(CLIPS) as ClipId[]).map(async (id) => {
        if (this.buffers.has(id)) return;
        const res = await fetch(CLIPS[id]);
        if (!res.ok) throw new Error(`crematory sfx ${id} ${res.status}`);
        const raw = await res.arrayBuffer();
        const buffer = await ctx.decodeAudioData(raw.slice(0));
        this.buffers.set(id, buffer);
      })
    );
  }

  private audible(): boolean {
    return (
      !audioManager.isInterfaceMuted() && audioManager.getSfxVolume() > 0.001
    );
  }

  private level(): number {
    return audioManager.getSfxVolume();
  }

  private applyGain(gain: GainNode): void {
    gain.gain.value = this.level();
  }

  private startLoop(kind: SweepClip): void {
    this.cutSweep();
    if (this.wanted !== kind || !this.audible()) return;
    const buffer = this.buffers.get(kind);
    if (!buffer) return;
    const ctx = audioManager.outputContext();
    if (ctx.state !== 'running') {
      void ctx.resume().then(() => {
        if (this.wanted === kind) this.startLoop(kind);
      });
      return;
    }
    const voice = this.spawn(buffer, true);
    this.sweep = { ...voice, kind };
    this.ensureWatch();
  }

  private startFall(which: FallClip): void {
    const buffer = this.buffers.get(which);
    if (!buffer || !this.audible()) return;
    const ctx = audioManager.outputContext();
    if (ctx.state !== 'running') {
      const gen = this.generation;
      void ctx.resume().then(() => {
        if (gen === this.generation) this.startFall(which);
      });
      return;
    }
    if (this.falls.length >= 4) this.halt(this.falls.shift()!);
    const voice = this.spawn(buffer, false);
    this.falls.push(voice);
    voice.source.onended = () => {
      this.falls = this.falls.filter((item) => item !== voice);
      this.halt(voice);
    };
    this.ensureWatch();
  }

  private spawn(buffer: AudioBuffer, loop: boolean): Voice {
    const ctx = audioManager.outputContext();
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    source.buffer = buffer;
    source.loop = loop;
    source.connect(gain);
    gain.connect(ctx.destination);
    this.applyGain(gain);
    source.start();
    return { source, gain };
  }

  private cutSweep(): void {
    if (!this.sweep) return;
    const voice = this.sweep;
    this.sweep = null;
    voice.source.onended = null;
    this.halt(voice);
  }

  private cutFalls(): void {
    const voices = this.falls;
    this.falls = [];
    for (const voice of voices) {
      voice.source.onended = null;
      this.halt(voice);
    }
  }

  private halt(voice: Voice): void {
    try {
      voice.source.stop();
    } catch {
      /* already stopped */
    }
    try {
      voice.source.disconnect();
      voice.gain.disconnect();
    } catch {
      /* ignore */
    }
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
    if (!this.audible()) {
      this.wanted = null;
      this.cutSweep();
      this.cutFalls();
    } else if (this.sweep && performance.now() - this.lastMove > SWEEP_HOLD_MS) {
      this.wanted = null;
      this.cutSweep();
    } else if (this.sweep) {
      this.applyGain(this.sweep.gain);
    }
    for (const fall of this.falls) this.applyGain(fall.gain);
    if (!this.sweep && this.falls.length === 0 && this.wanted == null) {
      this.clearWatch();
    }
  }
}

export const crematoryToolSfx = new CrematoryToolSfx();
