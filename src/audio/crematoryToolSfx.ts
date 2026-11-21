/**
 * Crematory rake, brush, and stirring-rod clips.
 * Sweep loops stay tied to the tool: stop() cuts them, they do not ring out.
 * A bone sweep picks a variation when the stroke starts and keeps it until
 * the tool stops, then a different one next stroke.
 * A bone-fall, once started, plays through even if the tool stops.
 * Level and mute follow the interface bus (the same gate as UI clicks).
 */
import { audioManager } from '../utils/audioManager';
import {
  pickVariation,
  RAKE_BONE_SWEEP_IDS,
  ROD_BONE_SWEEP_IDS,
  type FallClip,
  type RakeBoneSweepId,
  type RodBoneSweepId,
  type SweepClip,
} from './crematoryToolSfxPolicy';

const CLIPS = {
  dry: '/audio/crematory/ironrake-retort-sweep-dry.wav',
  /** Original rake-on-bone loop. Still one of the rake and brush variations. */
  bones: '/audio/crematory/ironrake-bones-sweep.wav',
  /** Zip bone-clip-1. Sustained bone scrape. */
  sweep1: '/audio/crematory/bone-sweep-clip1.wav',
  /** Zip bone-clip-2. Lighter bone scrape. */
  sweep2: '/audio/crematory/bone-sweep-clip2.wav',
  /** Zip bone-clip-3. Sustained bone scrape. */
  sweep3: '/audio/crematory/bone-sweep-clip3.wav',
  /** Zip bone-clip-5. Sustained bone scrape. */
  sweep5: '/audio/crematory/bone-sweep-clip5.wav',
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
  private lastBones: RakeBoneSweepId | null = null;
  private lastRod: RodBoneSweepId | null = null;
  private falls: Voice[] = [];
  private generation = 0;
  private watch: number | null = null;

  preload(): Promise<void> {
    if (this.buffers.size === Object.keys(CLIPS).length) return Promise.resolve();
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
    if (!this.sweepReady(kind)) {
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

  private sweepReady(kind: SweepClip): boolean {
    if (kind === 'dry') return this.buffers.has('dry');
    if (kind === 'rod') {
      return ROD_BONE_SWEEP_IDS.every((id) => this.buffers.has(id));
    }
    return RAKE_BONE_SWEEP_IDS.every((id) => this.buffers.has(id));
  }

  /** Picked once per stroke. The same kind keeps this buffer until the tool stops. */
  private chooseSweep(kind: SweepClip): AudioBuffer | null {
    if (kind === 'dry') return this.buffers.get('dry') ?? null;
    if (kind === 'rod') {
      const id = pickVariation(ROD_BONE_SWEEP_IDS, this.lastRod);
      this.lastRod = id;
      return this.buffers.get(id) ?? null;
    }
    const id = pickVariation(RAKE_BONE_SWEEP_IDS, this.lastBones);
    this.lastBones = id;
    return this.buffers.get(id) ?? null;
  }

  private startLoop(kind: SweepClip): void {
    this.cutSweep();
    if (this.wanted !== kind || !this.audible()) return;
    const ctx = audioManager.outputContext();
    if (ctx.state !== 'running') {
      void ctx.resume().then(() => {
        if (this.wanted === kind) this.startLoop(kind);
      });
      return;
    }
    const buffer = this.chooseSweep(kind);
    if (!buffer) return;
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
    if (loop) {
      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(this.level(), now + 0.003);
    } else {
      this.applyGain(gain);
    }
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
