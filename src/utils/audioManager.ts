/**
 * Shared music bed manager for Ossuarian.
 *
 * Decoded Web Audio buffers + GainNodes give Android WebView:
 * - sample-accurate gapless looping for run beds (AudioBufferSourceNode.loop)
 * - short overlapping crossfades between sequential clips (no hard cut)
 * - custom URL beds for Chapel service playlists (service:*)
 */

/** Default overlap when handing one bed to the next. Tune freely. */
export const CROSSFADE_MS = 900;

export type BuiltinBedId = 'theme' | 'crematoryStart' | 'crematoryLoop';
/** Built-in beds or dynamic `service:<trackId>` playlist entries. */
export type MusicBedId = BuiltinBedId | string;

const BED_URLS: Record<BuiltinBedId, string> = {
  theme: '/audio/ossuarian-theme.m4a',
  crematoryStart: '/audio/crematory-start.m4a',
  crematoryLoop: '/audio/crematory-loop.m4a',
};

const DEFAULT_VOLUME: Record<BuiltinBedId, number> = {
  theme: 0.55,
  crematoryStart: 0.7,
  crematoryLoop: 0.55,
};

function isBuiltin(id: string): id is BuiltinBedId {
  return id === 'theme' || id === 'crematoryStart' || id === 'crematoryLoop';
}

export function isCrematoryBed(id: string | null | undefined): boolean {
  return id === 'crematoryStart' || id === 'crematoryLoop';
}

type Voice = {
  id: MusicBedId;
  source: AudioBufferSourceNode;
  gain: GainNode;
  startedAt: number;
  endsAt: number | null;
  loop: boolean;
  generation: number;
};

class AudioManager {
  private ctx: AudioContext | null = null;
  private buffers = new Map<string, AudioBuffer>();
  private loadPromises = new Map<string, Promise<AudioBuffer>>();
  private urlById = new Map<string, string>();
  private voices: Voice[] = [];
  private currentId: MusicBedId | null = null;
  private unlocked = false;
  private generation = 0;
  private handoffTimer: number | null = null;
  private oneShotHandlers = new Set<(id: MusicBedId) => void>();
  private muted = false;
  private unmuteHandlers = new Set<() => void>();

  /** Tunable crossfade length in milliseconds. */
  crossfadeMs = CROSSFADE_MS;

  isMuted(): boolean {
    return this.muted;
  }

  addUnmuteHandler(handler: () => void) {
    this.unmuteHandlers.add(handler);
  }

  removeUnmuteHandler(handler: () => void) {
    this.unmuteHandlers.delete(handler);
  }

  setMuted(muted: boolean) {
    if (muted) {
      this.muted = true;
      this.stopImmediate();
      return;
    }
    if (!this.muted) return;
    this.muted = false;
    // Controllers re-assert the correct bed for the current room.
    for (const h of this.unmuteHandlers) {
      try {
        h();
      } catch {
        /* ignore */
      }
    }
  }

  /** @deprecated prefer add/removeOneShotNearEndHandler for multi-listeners */
  setOneShotNearEndHandler(handler: ((id: MusicBedId) => void) | null) {
    this.oneShotHandlers.clear();
    if (handler) this.oneShotHandlers.add(handler);
  }

  addOneShotNearEndHandler(handler: (id: MusicBedId) => void) {
    this.oneShotHandlers.add(handler);
  }

  removeOneShotNearEndHandler(handler: (id: MusicBedId) => void) {
    this.oneShotHandlers.delete(handler);
  }

  private getOrCreateContext(): AudioContext {
    if (this.ctx) return this.ctx;
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    this.ctx = new Ctor();
    return this.ctx;
  }

  /** Call from a user gesture so WebView audio is allowed. */
  async unlock(): Promise<void> {
    const ctx = this.getOrCreateContext();
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch {
        /* ignore */
      }
    }
    this.unlocked = true;
    await Promise.all([
      this.preload('crematoryStart').catch(() => undefined),
      this.preload('crematoryLoop').catch(() => undefined),
      this.preload('theme').catch(() => undefined),
    ]);
  }

  registerUrl(id: string, url: string) {
    const prev = this.urlById.get(id);
    if (prev === url) return;
    this.urlById.set(id, url);
    // Invalidate cached buffer if URL changed
    this.buffers.delete(id);
    this.loadPromises.delete(id);
  }

  async preload(id: MusicBedId): Promise<AudioBuffer> {
    const existing = this.buffers.get(id);
    if (existing) return existing;
    const inflight = this.loadPromises.get(id);
    if (inflight) return inflight;

    const url = isBuiltin(id) ? BED_URLS[id] : this.urlById.get(id);
    if (!url) {
      throw new Error(`No URL registered for bed "${id}"`);
    }

    const promise = (async () => {
      const ctx = this.getOrCreateContext();
      const res = await fetch(url);
      const raw = await res.arrayBuffer();
      const buffer = await ctx.decodeAudioData(raw.slice(0));
      this.buffers.set(id, buffer);
      this.loadPromises.delete(id);
      return buffer;
    })();

    this.loadPromises.set(id, promise);
    return promise;
  }

  getCurrentId(): MusicBedId | null {
    return this.currentId;
  }

  private clearHandoffTimer() {
    if (this.handoffTimer != null) {
      window.clearTimeout(this.handoffTimer);
      this.handoffTimer = null;
    }
  }

  private isStale(gen: number): boolean {
    return gen !== this.generation;
  }

  private stopVoice(voice: Voice, when: number) {
    try {
      voice.source.stop(when);
    } catch {
      /* already stopped */
    }
  }

  private pruneVoices() {
    const ctx = this.ctx;
    if (!ctx) {
      this.voices = [];
      return;
    }
    const t = ctx.currentTime;
    this.voices = this.voices.filter((v) => {
      if (v.endsAt != null && v.endsAt < t - 0.05) {
        try {
          v.source.disconnect();
          v.gain.disconnect();
        } catch {
          /* ignore */
        }
        return false;
      }
      return true;
    });
  }

  private fadeOutVoices(durationSec: number, exceptGeneration?: number) {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    for (const voice of this.voices) {
      if (exceptGeneration != null && voice.generation === exceptGeneration) {
        continue;
      }
      try {
        const current = Math.max(0.0001, voice.gain.gain.value);
        voice.gain.gain.cancelScheduledValues(t);
        voice.gain.gain.setValueAtTime(current, t);
        voice.gain.gain.linearRampToValueAtTime(0.0001, t + durationSec);
        this.stopVoice(voice, t + durationSec + 0.03);
        voice.endsAt = t + durationSec + 0.03;
        voice.loop = false;
      } catch {
        /* ignore */
      }
    }
  }

  private startVoice(
    id: MusicBedId,
    buffer: AudioBuffer,
    opts: {
      loop: boolean;
      volume: number;
      fadeInSec: number;
      generation: number;
    }
  ): Voice {
    const ctx = this.getOrCreateContext();
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    source.buffer = buffer;
    source.loop = opts.loop;
    source.connect(gain);
    gain.connect(ctx.destination);

    const t = ctx.currentTime;
    const vol = Math.max(0.0001, opts.volume);
    if (opts.fadeInSec > 0) {
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(vol, t + opts.fadeInSec);
    } else {
      gain.gain.setValueAtTime(vol, t);
    }

    source.start(t);

    const voice: Voice = {
      id,
      source,
      gain,
      startedAt: t,
      endsAt: opts.loop ? null : t + Math.max(0.05, buffer.duration),
      loop: opts.loop,
      generation: opts.generation,
    };
    this.voices.push(voice);
    return voice;
  }

  private scheduleOneShotNearEnd(
    id: MusicBedId,
    buffer: AudioBuffer,
    voice: Voice,
    crossfadeMs: number
  ) {
    this.clearHandoffTimer();
    const fadeSec = crossfadeMs / 1000;
    const handoffAt =
      voice.startedAt + Math.max(0.05, buffer.duration - fadeSec);

    const tick = () => {
      this.handoffTimer = null;
      if (this.currentId !== id) return;
      const ctx = this.ctx;
      if (!ctx) return;

      if (ctx.state === 'suspended' || ctx.currentTime < handoffAt) {
        const remainingSec =
          ctx.state === 'suspended'
            ? 0.1
            : Math.max(0.016, handoffAt - ctx.currentTime);
        this.handoffTimer = window.setTimeout(
          tick,
          Math.min(250, remainingSec * 1000)
        );
        return;
      }

      for (const h of this.oneShotHandlers) {
        try {
          h(id);
        } catch {
          /* ignore listener errors */
        }
      }
    };

    this.handoffTimer = window.setTimeout(tick, 40);
  }

  /**
   * Crossfade to a bed (or fade in from silence).
   * Loop beds use AudioBufferSourceNode.loop (gapless).
   * One-shots fire onOneShotNearEnd before they finish.
   */
  async crossfadeTo(
    id: MusicBedId,
    options?: {
      loop?: boolean;
      volume?: number;
      durationMs?: number;
      /** Required for non-builtin beds */
      url?: string;
    }
  ): Promise<void> {
    if (this.muted) {
      this.currentId = null;
      return;
    }
    if (options?.url) {
      this.registerUrl(id, options.url);
    }

    const loop =
      options?.loop ?? (id === 'theme' || id === 'crematoryLoop');
    const volume =
      options?.volume ??
      (isBuiltin(id) ? DEFAULT_VOLUME[id] : 0.28);
    const fadeMs = options?.durationMs ?? this.crossfadeMs;
    const fadeSec = Math.max(0.05, fadeMs / 1000);

    if (this.currentId === id && loop) {
      return;
    }

    this.generation += 1;
    const gen = this.generation;

    if (!this.unlocked) {
      await this.unlock();
    }
    if (this.isStale(gen)) return;

    const ctx = this.getOrCreateContext();
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch {
        /* ignore */
      }
    }
    if (this.isStale(gen)) return;

    const buffer = await this.preload(id);
    if (this.isStale(gen)) return;

    this.clearHandoffTimer();
    this.fadeOutVoices(fadeSec);
    this.currentId = id;
    const voice = this.startVoice(id, buffer, {
      loop,
      volume,
      fadeInSec: fadeSec,
      generation: gen,
    });

    if (!loop) {
      this.scheduleOneShotNearEnd(id, buffer, voice, fadeMs);
    }

    window.setTimeout(() => this.pruneVoices(), fadeMs + 100);
  }

  async fadeOut(durationMs: number = this.crossfadeMs): Promise<void> {
    this.clearHandoffTimer();
    this.generation += 1;
    const fadeSec = Math.max(0.05, durationMs / 1000);
    this.fadeOutVoices(fadeSec);
    this.currentId = null;
    window.setTimeout(() => this.pruneVoices(), durationMs + 100);
  }

  stopImmediate() {
    this.clearHandoffTimer();
    this.generation += 1;
    const ctx = this.ctx;
    const t = ctx?.currentTime ?? 0;
    for (const voice of this.voices) {
      try {
        voice.gain.gain.cancelScheduledValues(t);
        voice.gain.gain.setValueAtTime(0.0001, t);
        this.stopVoice(voice, t);
      } catch {
        /* ignore */
      }
    }
    this.voices = [];
    this.currentId = null;
  }
}

export const audioManager = new AudioManager();

/** Ensure gesture unlock + preload; safe to call repeatedly. */
export function unlockGameAudio(): Promise<void> {
  return audioManager.unlock();
}
