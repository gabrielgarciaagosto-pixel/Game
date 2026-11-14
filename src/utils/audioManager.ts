/**
 * Shared music bed manager for Ossuarian.
 *
 * Decoded Web Audio buffers + GainNodes give Android WebView:
 * - sample-accurate gapless looping for run beds (AudioBufferSourceNode.loop)
 * - short overlapping crossfades between sequential clips (no hard cut)
 */

/** Default overlap when handing one bed to the next. Tune freely. */
export const CROSSFADE_MS = 900;

export type MusicBedId = 'theme' | 'crematoryStart' | 'crematoryLoop';

const BED_URLS: Record<MusicBedId, string> = {
  theme: '/audio/ossuarian-theme.m4a',
  crematoryStart: '/audio/crematory-start.m4a',
  crematoryLoop: '/audio/crematory-loop.m4a',
};

const DEFAULT_VOLUME: Record<MusicBedId, number> = {
  theme: 0.55,
  crematoryStart: 0.7,
  crematoryLoop: 0.55,
};

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
  private buffers = new Map<MusicBedId, AudioBuffer>();
  private loadPromises = new Map<MusicBedId, Promise<AudioBuffer>>();
  private voices: Voice[] = [];
  private currentId: MusicBedId | null = null;
  private unlocked = false;
  private generation = 0;
  private handoffTimer: number | null = null;
  private onOneShotNearEnd: ((id: MusicBedId) => void) | null = null;

  /** Tunable crossfade length in milliseconds. */
  crossfadeMs = CROSSFADE_MS;

  setOneShotNearEndHandler(handler: ((id: MusicBedId) => void) | null) {
    this.onOneShotNearEnd = handler;
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
    // Prefer crematory assets first — that handoff is the audible problem
    await Promise.all([
      this.preload('crematoryStart').catch(() => undefined),
      this.preload('crematoryLoop').catch(() => undefined),
      this.preload('theme').catch(() => undefined),
    ]);
  }

  async preload(id: MusicBedId): Promise<AudioBuffer> {
    const existing = this.buffers.get(id);
    if (existing) return existing;
    const inflight = this.loadPromises.get(id);
    if (inflight) return inflight;

    const promise = (async () => {
      const ctx = this.getOrCreateContext();
      const res = await fetch(BED_URLS[id]);
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

  /** True when a later crossfadeTo/fadeOut/stop invalidated this call. */
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
        // Native looping sources must be stopped; mark non-loop end
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
    // Gapless for decoded PCM — preferred for the crematory run bed
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

  /**
   * Fire onOneShotNearEnd when AudioContext time reaches
   * voice.startedAt + duration - crossfade — not wall-clock.
   * If the context is suspended (no gesture / backgrounded), currentTime
   * freezes and we wait until it advances again.
   */
  private scheduleOneShotNearEnd(
    id: MusicBedId,
    buffer: AudioBuffer,
    voice: Voice
  ) {
    this.clearHandoffTimer();
    const fadeSec = this.crossfadeMs / 1000;
    const handoffAt =
      voice.startedAt + Math.max(0.05, buffer.duration - fadeSec);

    const tick = () => {
      this.handoffTimer = null;
      if (this.currentId !== id) return;
      const ctx = this.ctx;
      if (!ctx) return;

      if (ctx.state === 'suspended' || ctx.currentTime < handoffAt) {
        // Poll until the audio clock reaches the handoff point
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

      this.onOneShotNearEnd?.(id);
    };

    this.handoffTimer = window.setTimeout(tick, 40);
  }

  /**
   * Crossfade to a bed (or fade in from silence).
   * Loop beds use AudioBufferSourceNode.loop (gapless).
   * One-shots fire onOneShotNearEnd CROSSFADE_MS before they finish.
   */
  async crossfadeTo(
    id: MusicBedId,
    options?: { loop?: boolean; volume?: number; durationMs?: number }
  ): Promise<void> {
    const loop =
      options?.loop ?? (id === 'theme' || id === 'crematoryLoop');
    const volume = options?.volume ?? DEFAULT_VOLUME[id];
    const fadeMs = options?.durationMs ?? this.crossfadeMs;
    const fadeSec = Math.max(0.05, fadeMs / 1000);

    // Already on this looping bed — leave it alone (avoids restart clicks)
    if (this.currentId === id && loop) {
      return;
    }

    // Invalidate any in-flight crossfade before awaiting unlock/preload
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
      this.scheduleOneShotNearEnd(id, buffer, voice);
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
