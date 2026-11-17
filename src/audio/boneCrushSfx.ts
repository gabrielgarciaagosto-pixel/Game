/**
 * Hammer strikes that actually crush bone.
 * Each strike plays one hit from the crushing take, and the next strike
 * picks a different hit. A strike plays through. Leaving the processor cuts it.
 * Level and mute follow the interface bus.
 */
import { audioManager } from '../utils/audioManager';
import {
  BONE_CRUSH_IDS,
  pickVariation,
  type BoneCrushId,
} from './crematoryToolSfxPolicy';

const CLIPS: Record<BoneCrushId, string> = {
  /** Zip bone-clip-4, first strike. */
  crushA: '/audio/crematory/bone-crush-clip4-a.wav',
  /** Zip bone-clip-4, second strike. */
  crushB: '/audio/crematory/bone-crush-clip4-b.wav',
  /** Zip bone-clip-4, third strike. */
  crushC: '/audio/crematory/bone-crush-clip4-c.wav',
  /** Zip bone-clip-4, fourth strike. */
  crushD: '/audio/crematory/bone-crush-clip4-d.wav',
};

type Voice = {
  source: AudioBufferSourceNode;
  gain: GainNode;
};

class BoneCrushSfx {
  private buffers = new Map<BoneCrushId, AudioBuffer>();
  private loading: Promise<void> | null = null;
  private voices: Voice[] = [];
  private last: BoneCrushId | null = null;
  private generation = 0;
  private watch: number | null = null;

  preload(): Promise<void> {
    if (this.buffers.size === BONE_CRUSH_IDS.length) return Promise.resolve();
    if (this.loading) return this.loading;
    this.loading = this.loadAll().catch((err: unknown) => {
      this.loading = null;
      throw err;
    });
    return this.loading;
  }

  /** One hit. Does nothing while the interface is muted or the slider is down. */
  play(): void {
    const gen = this.generation;
    const start = () => {
      if (gen !== this.generation || !this.audible()) return;
      this.startOne();
    };
    if (BONE_CRUSH_IDS.every((id) => this.buffers.has(id))) {
      start();
      return;
    }
    void this.preload().then(start).catch(() => undefined);
  }

  stop(): void {
    this.generation += 1;
    this.cut();
    this.clearWatch();
  }

  private async loadAll(): Promise<void> {
    const ctx = audioManager.outputContext();
    await Promise.all(
      BONE_CRUSH_IDS.map(async (id) => {
        if (this.buffers.has(id)) return;
        const res = await fetch(CLIPS[id]);
        if (!res.ok) throw new Error(`bone crush ${id} ${res.status}`);
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

  private startOne(): void {
    if (!this.audible()) return;
    const ctx = audioManager.outputContext();
    if (ctx.state !== 'running') {
      const gen = this.generation;
      void ctx.resume().then(() => {
        if (gen === this.generation) this.startOne();
      });
      return;
    }
    const id = pickVariation(BONE_CRUSH_IDS, this.last);
    const buffer = this.buffers.get(id);
    if (!buffer) return;
    this.last = id;
    if (this.voices.length >= 3) this.halt(this.voices.shift()!);
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    source.buffer = buffer;
    source.loop = false;
    source.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.value = this.level();
    source.start();
    const voice = { source, gain };
    this.voices.push(voice);
    source.onended = () => {
      this.voices = this.voices.filter((item) => item !== voice);
      this.halt(voice);
    };
    this.ensureWatch();
  }

  private cut(): void {
    const voices = this.voices;
    this.voices = [];
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
      this.cut();
    } else {
      const level = this.level();
      for (const voice of this.voices) voice.gain.gain.value = level;
    }
    if (this.voices.length === 0) this.clearWatch();
  }
}

export const boneCrushSfx = new BoneCrushSfx();
