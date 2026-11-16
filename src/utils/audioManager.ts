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

/** Full interface slider. Clicks were mixed at this gain before the slider existed. */
const INTERFACE_AT_FULL = 0.45;

export const AUDIO_PREFS_KEY = 'ossuarian-audio-prefs';

export type AudioPrefs = {
  musicVolume: number;
  musicMuted: boolean;
  interfaceVolume: number;
  interfaceMuted: boolean;
};

const DEFAULT_AUDIO_PREFS: AudioPrefs = {
  musicVolume: 1,
  musicMuted: false,
  interfaceVolume: 1,
  interfaceMuted: false,
};

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

export function readAudioPrefs(): AudioPrefs {
  try {
    const raw = localStorage.getItem(AUDIO_PREFS_KEY);
    if (!raw) return { ...DEFAULT_AUDIO_PREFS };
    const parsed = JSON.parse(raw) as Partial<AudioPrefs>;
    return {
      musicVolume: clamp01(
        typeof parsed.musicVolume === 'number'
          ? parsed.musicVolume
          : DEFAULT_AUDIO_PREFS.musicVolume
      ),
      musicMuted: parsed.musicMuted === true,
      interfaceVolume: clamp01(
        typeof parsed.interfaceVolume === 'number'
          ? parsed.interfaceVolume
          : DEFAULT_AUDIO_PREFS.interfaceVolume
      ),
      interfaceMuted: parsed.interfaceMuted === true,
    };
  } catch {
    return { ...DEFAULT_AUDIO_PREFS };
  }
}

function writeAudioPrefs(prefs: AudioPrefs) {
  try {
    localStorage.setItem(AUDIO_PREFS_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}

function isBuiltin(id: string): id is BuiltinBedId {
  return id === 'theme' || id === 'crematoryStart' || id === 'crematoryLoop';
}

export function isCrematoryBed(id: string | null | undefined): boolean {
  return id === 'crematoryStart' || id === 'crematoryLoop';
}

/**
 * Race `work` against a timer and always clear that timer.
 * A decode that finishes first must not leave the timer to reject later.
 */
export function withDeadline<T>(
  work: Promise<T>,
  ms: number,
  label: string,
  clock?: {
    set: (fn: () => void, delay: number) => number;
    clear: (id: number) => void;
  }
): Promise<T> {
  const set =
    clock?.set ??
    ((fn: () => void, delay: number) => window.setTimeout(fn, delay) as unknown as number);
  const clear = clock?.clear ?? ((id: number) => window.clearTimeout(id));
  let timer = 0;
  const timeout = new Promise<never>((_, reject) => {
    timer = set(() => reject(new Error(label)), ms);
  });
  timeout.catch(() => undefined);
  return Promise.race([work, timeout]).finally(() => {
    clear(timer);
  }) as Promise<T>;
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
  private musicMuted = false;
  /** Player music level, 0–1. 1 is the mix the beds were written at. */
  private musicVolume = 1;
  /** Last bed level before the player music slider (playlist × duck). */
  private lastMusicLevel = 0.55;
  private interfaceMuted = false;
  /** Player interface level, 0–1. 1 matches the original click loudness. */
  private interfaceLevel = 1;
  private unmuteHandlers = new Set<() => void>();
  /** One-shot SFX level (0–1). Interface mute gates SFX without stopping music. */
  private sfxVolume = 0.45;
  private lastPingAt = 0;
  private lastChimeAt = 0;
  private lastClickAt = 0;
  private gestureInstalled = false;
  /** File beds that `decodeAudioData` rejected. HTMLAudioElement plays those. */
  private elements: HTMLAudioElement[] = [];
  /** Detach a one-shot fallback's near-end and ended listeners. */
  private elementWatches = new Map<HTMLAudioElement, () => void>();
  /** A fallback bed whose play() was blocked. Retried on the next gesture. */
  private pendingPlay: {
    el: HTMLAudioElement;
    id: MusicBedId;
    generation: number;
  } | null = null;
  private elementFades = new WeakMap<HTMLAudioElement, number>();

  /** Tunable crossfade length in milliseconds. */
  crossfadeMs = CROSSFADE_MS;

  constructor() {
    this.hydratePrefs();
  }

  isMuted(): boolean {
    return this.musicMuted;
  }

  getSfxVolume(): number {
    return this.sfxVolume;
  }

  getMusicVolume(): number {
    return this.musicVolume;
  }

  isMusicMuted(): boolean {
    return this.musicMuted;
  }

  /** 0–1. One is the current interface loudness, not a raw gain. */
  getInterfaceVolume(): number {
    return this.interfaceLevel;
  }

  isInterfaceMuted(): boolean {
    return this.interfaceMuted;
  }

  setSfxVolume(volume: number) {
    const abs = Math.max(0, Math.min(1, volume));
    this.sfxVolume = abs;
    this.interfaceLevel = clamp01(abs / INTERFACE_AT_FULL);
    this.writePrefs();
  }

  setMusicVolume(volume: number) {
    this.musicVolume = clamp01(volume);
    this.writePrefs();
    if (this.musicMuted) return;
    this.setCurrentVolume(this.lastMusicLevel, 80);
  }

  setMusicMuted(muted: boolean) {
    if (muted === this.musicMuted) return;
    this.musicMuted = muted;
    this.writePrefs();
    if (muted) {
      this.stopImmediate();
      return;
    }
    this.fireUnmute();
  }

  setInterfaceVolume(volume: number) {
    this.interfaceLevel = clamp01(volume);
    this.sfxVolume = this.interfaceLevel * INTERFACE_AT_FULL;
    this.writePrefs();
  }

  setInterfaceMuted(muted: boolean) {
    if (muted === this.interfaceMuted) return;
    this.interfaceMuted = muted;
    this.writePrefs();
  }

  private hydratePrefs() {
    const prefs = readAudioPrefs();
    this.musicVolume = prefs.musicVolume;
    this.musicMuted = prefs.musicMuted;
    this.interfaceLevel = prefs.interfaceVolume;
    this.interfaceMuted = prefs.interfaceMuted;
    this.sfxVolume = this.interfaceLevel * INTERFACE_AT_FULL;
  }

  private writePrefs() {
    writeAudioPrefs({
      musicVolume: this.musicVolume,
      musicMuted: this.musicMuted,
      interfaceVolume: this.interfaceLevel,
      interfaceMuted: this.interfaceMuted,
    });
  }

  private fireUnmute() {
    for (const h of this.unmuteHandlers) {
      try {
        h();
      } catch {
        /* ignore */
      }
    }
  }

  private scaledMusic(level: number): number {
    this.lastMusicLevel = level;
    if (this.musicMuted || this.musicVolume <= 0) return 0.0001;
    return Math.max(0.0001, Math.min(1, level * this.musicVolume));
  }

  addUnmuteHandler(handler: () => void) {
    this.unmuteHandlers.add(handler);
  }

  removeUnmuteHandler(handler: () => void) {
    this.unmuteHandlers.delete(handler);
  }

  setMuted(muted: boolean) {
    const restartMusic = this.musicMuted && !muted;
    this.musicMuted = muted;
    this.interfaceMuted = muted;
    this.writePrefs();
    if (muted) {
      this.stopImmediate();
      return;
    }
    if (!restartMusic) return;
    this.fireUnmute();
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

  /**
   * Resume on every tap, not only the first. A stray pointerdown used to
   * consume a once-only listener and leave the context suspended, which
   * dropped both the music bed and the short clicks.
   */
  installGestureUnlock(): void {
    if (this.gestureInstalled || typeof window === 'undefined') return;
    this.gestureInstalled = true;
    const kick = () => {
      void this.unlock();
    };
    window.addEventListener('pointerdown', kick, { passive: true });
    window.addEventListener('touchstart', kick, { passive: true });
    window.addEventListener('keydown', kick);
  }

  /** The one context SFX and music share. A second context steals Android audio focus. */
  outputContext(): AudioContext {
    return this.getOrCreateContext();
  }

  /** Call from a user gesture so WebView audio is allowed. */
  async unlock(): Promise<void> {
    const ctx = this.getOrCreateContext();
    if (ctx.state === 'suspended' || ctx.state === 'interrupted') {
      try {
        await ctx.resume();
      } catch {
        /* ignore */
      }
    }
    this.retryPendingElement();
    if (this.unlocked) return;
    this.unlocked = true;
    // Theme is not a live bed. Crematory clips preload in the background
    // so a slow decode cannot hold the first tap.
    void this.preload('crematoryStart').catch(() => undefined);
    void this.preload('crematoryLoop').catch(() => undefined);
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
      if (!res.ok) {
        this.loadPromises.delete(id);
        throw new Error(`bed ${id} ${res.status}`);
      }
      const raw = await res.arrayBuffer();
      const buffer = await withDeadline(
        ctx.decodeAudioData(raw.slice(0)),
        12000,
        `decode timeout ${id}`
      );
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

  /**
   * True when this bed is the live voice, or the fallback element still
   * waiting for play() to be allowed. A blocked play() leaves currentId null.
   */
  bedIsCurrent(id: MusicBedId): boolean {
    if (this.currentId === id) return true;
    const pending = this.pendingPlay;
    return pending?.id === id && pending.generation === this.generation;
  }

  /**
   * Ramp the live music bed. Does not restart the clip, touch SFX, or
   * unmute a muted bus. Caller passes the player level (playlist volume
   * times any room duck).
   */
  setCurrentVolume(volume: number, durationMs: number): void {
    const vol = this.scaledMusic(volume);
    if (this.musicMuted) return;
    if (this.ctx) {
      const dur = Math.max(0.05, durationMs / 1000);
      const t = this.ctx.currentTime;
      for (const voice of this.voices) {
        if (voice.generation !== this.generation) continue;
        if (voice.endsAt != null && voice.endsAt < t) continue;
        try {
          const now = Math.max(0.0001, voice.gain.gain.value);
          voice.gain.gain.cancelScheduledValues(t);
          voice.gain.gain.setValueAtTime(now, t);
          voice.gain.gain.linearRampToValueAtTime(vol, t + dur);
        } catch {
          /* ignore */
        }
      }
    }
    for (const el of this.elements) this.fadeElement(el, vol, durationMs);
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
    if (this.musicMuted) {
      this.lastMusicLevel = options?.volume ?? this.lastMusicLevel;
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

    let buffer: AudioBuffer;
    try {
      buffer = await this.preload(id);
    } catch {
      if (this.isStale(gen)) return;
      const fileUrl = isBuiltin(id) ? BED_URLS[id] : this.urlById.get(id);
      if (!fileUrl) return;
      await this.playElement(id, fileUrl, {
        loop,
        volume: this.scaledMusic(volume),
        fadeSec,
        generation: gen,
      });
      return;
    }
    if (this.isStale(gen)) return;

    this.clearHandoffTimer();
    this.fadeOutVoices(fadeSec);
    this.releaseElements(fadeSec);
    this.currentId = id;
    const voice = this.startVoice(id, buffer, {
      loop,
      volume: this.scaledMusic(volume),
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
    this.releaseElements(fadeSec);
    this.currentId = null;
    window.setTimeout(() => this.pruneVoices(), durationMs + 100);
  }

  private fadeElement(
    el: HTMLAudioElement,
    to: number,
    durationMs: number,
    done?: () => void
  ) {
    const prev = this.elementFades.get(el);
    if (prev != null) window.clearInterval(prev);
    const from = Number.isFinite(el.volume) ? el.volume : 0.0001;
    const dest = Math.max(0, Math.min(1, to));
    const steps = 8;
    let i = 0;
    const timer = window.setInterval(() => {
      i += 1;
      const next = from + (dest - from) * Math.min(1, i / steps);
      try {
        el.volume = Math.max(0, Math.min(1, next));
      } catch {
        /* ignore */
      }
      if (i >= steps) {
        window.clearInterval(timer);
        if (this.elementFades.get(el) === timer) this.elementFades.delete(el);
        done?.();
      }
    }, Math.max(16, durationMs / steps));
    this.elementFades.set(el, timer as unknown as number);
  }

  /** Fade a fallback bed out, then pause it. A hard cut skips the crossfade. */
  private releaseElements(fadeSec: number) {
    const old = this.elements;
    this.elements = [];
    if (this.pendingPlay && old.includes(this.pendingPlay.el)) this.pendingPlay = null;
    for (const el of old) {
      this.stopElementWatch(el);
      const finish = () => {
        try {
          el.pause();
          el.src = '';
        } catch {
          /* ignore */
        }
      };
      if (fadeSec <= 0.05) {
        finish();
        continue;
      }
      this.fadeElement(el, 0, fadeSec * 1000, finish);
    }
  }

  private stopElements() {
    this.releaseElements(0);
  }

  private retryPendingElement() {
    const pending = this.pendingPlay;
    if (!pending || pending.generation !== this.generation) return;
    void pending.el
      .play()
      .then(() => {
        if (this.pendingPlay?.el !== pending.el) return;
        if (pending.generation !== this.generation) {
          try {
            pending.el.pause();
          } catch {
            /* ignore */
          }
          return;
        }
        this.currentId = pending.id;
        this.pendingPlay = null;
      })
      .catch(() => undefined);
  }

  private async tryElementPlay(el: HTMLAudioElement, id: MusicBedId, generation: number) {
    this.pendingPlay = { el, id, generation };
    try {
      await el.play();
    } catch {
      if (this.currentId === id && this.pendingPlay?.el === el) this.currentId = null;
      return;
    }
    if (generation !== this.generation || this.pendingPlay?.el !== el) {
      try {
        el.pause();
      } catch {
        /* ignore */
      }
      return;
    }
    this.currentId = id;
    this.pendingPlay = null;
  }

  private stopElementWatch(el: HTMLAudioElement) {
    const stop = this.elementWatches.get(el);
    if (!stop) return;
    this.elementWatches.delete(el);
    stop();
  }

  /**
   * One-shot fallback beds crossfade on timeupdate inside the fade window.
   * `ended` is the handoff if that window is missed. Either path fires once.
   */
  private watchElementNearEnd(el: HTMLAudioElement, id: MusicBedId, fadeSec: number) {
    let handed = false;
    const detach = () => {
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('ended', onEnded);
    };
    const stop = () => {
      handed = true;
      detach();
    };
    const handoff = () => {
      if (handed) return;
      if (this.currentId !== id || !this.elements.includes(el)) {
        stop();
        this.elementWatches.delete(el);
        return;
      }
      handed = true;
      detach();
      this.elementWatches.delete(el);
      for (const handler of this.oneShotHandlers) {
        try {
          handler(id);
        } catch {
          /* ignore */
        }
      }
    };
    const onTime = () => {
      if (handed || this.currentId !== id) return;
      const duration = el.duration;
      if (!Number.isFinite(duration) || duration <= 0) return;
      if (duration - el.currentTime > fadeSec) return;
      handoff();
    };
    const onEnded = () => {
      handoff();
    };
    this.elementWatches.set(el, stop);
    el.addEventListener('timeupdate', onTime);
    el.addEventListener('ended', onEnded);
  }

  /**
   * Android WebView rejects some m4a codecs in decodeAudioData. The media
   * element uses the platform decoder instead, so the bed still plays.
   */
  private async playElement(
    id: MusicBedId,
    url: string,
    opts: { loop: boolean; volume: number; fadeSec: number; generation: number }
  ) {
    this.fadeOutVoices(opts.fadeSec);
    this.releaseElements(opts.fadeSec);
    this.currentId = null;
    const el = new Audio(url);
    el.loop = opts.loop;
    el.preload = 'auto';
    el.volume = 0.0001;
    this.elements.push(el);
    const vol = Math.max(0.0001, Math.min(1, opts.volume));
    this.fadeElement(el, vol, opts.fadeSec * 1000);
    if (!opts.loop) this.watchElementNearEnd(el, id, opts.fadeSec);
    await this.tryElementPlay(el, id, opts.generation);
  }

  stopImmediate() {
    this.clearHandoffTimer();
    this.generation += 1;
    this.stopElements();
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

  /**
   * Subtle mortuary notification ping (toast / alert / bank).
   * Separate from music beds — never fades or stops menu/chapel tracks.
   * Respects mute + sfxVolume; debounced so toast storms don't stack.
   */
  playNotificationPing(debounceMs = 480): void {
    if (this.interfaceMuted || this.sfxVolume <= 0.001) return;
    const now = performance.now();
    if (now - this.lastPingAt < debounceMs) return;
    this.lastPingAt = now;

    try {
      const ctx = this.getOrCreateContext();
      if (ctx.state === 'suspended') {
        void ctx.resume();
      }
      const t = ctx.currentTime;
      const master = ctx.createGain();
      master.gain.setValueAtTime(0.0001, t);
      master.gain.linearRampToValueAtTime(
        Math.max(0.0001, this.sfxVolume * 0.22),
        t + 0.012
      );
      master.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
      master.connect(ctx.destination);

      // Soft bronze bell: fundamental + quiet fifth
      for (const [freq, amp] of [
        [392, 1],
        [588, 0.35],
        [784, 0.18],
      ] as const) {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        g.gain.setValueAtTime(amp, t);
        osc.connect(g);
        g.connect(master);
        osc.start(t);
        osc.stop(t + 0.6);
      }
    } catch {
      /* ignore WebAudio failures */
    }
  }

  /**
   * Soft airport-PA ding when an effect headline lands.
   * Two falling tones plus a quiet third, synthesized in the shared context.
   * Mute and sfxVolume apply. A second landing inside the window does not stack.
   */
  playNewsChime(debounceMs = 2400): void {
    if (this.interfaceMuted || this.sfxVolume <= 0.001) return;
    const now = performance.now();
    if (now - this.lastChimeAt < debounceMs) return;
    this.lastChimeAt = now;

    try {
      const ctx = this.getOrCreateContext();
      if (ctx.state === 'suspended' || ctx.state === 'interrupted') {
        void ctx.resume();
      }
      const t = ctx.currentTime;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, t);
      filter.Q.setValueAtTime(0.5, t);
      const master = ctx.createGain();
      master.gain.setValueAtTime(Math.max(0.0001, this.sfxVolume * 0.08), t);
      master.connect(filter);
      filter.connect(ctx.destination);

      const notes: ReadonlyArray<readonly [number, number, number, number]> = [
        [659.25, 0, 0.48, 0.8],
        [523.25, 0.32, 0.62, 1],
        [392, 0.64, 0.78, 0.5],
      ];
      for (const [freq, at, dur, amp] of notes) {
        const start = t + at;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, start);
        g.gain.exponentialRampToValueAtTime(Math.max(0.0001, amp), start + 0.018);
        g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
        g.connect(master);

        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        osc.connect(g);
        osc.start(start);
        osc.stop(start + dur + 0.02);

        const partial = ctx.createOscillator();
        const pg = ctx.createGain();
        partial.type = 'sine';
        partial.frequency.setValueAtTime(freq * 2, start);
        pg.gain.setValueAtTime(0.12, start);
        partial.connect(pg);
        pg.connect(g);
        partial.start(start);
        partial.stop(start + dur + 0.02);
      }
    } catch {
      /* ignore WebAudio failures */
    }
  }

  /**
   * Short UI click. Generated in this AudioContext — no sample file.
   * Tick is a menu button. Clunk is a retort control.
   * Respects mute and sfxVolume. Starts on currentTime so Android stays tight.
   */
  playUiClick(kind: 'tick' | 'clunk' = 'tick'): void {
    if (this.interfaceMuted || this.sfxVolume <= 0.001) return;
    const now = performance.now();
    if (now - this.lastClickAt < 32) return;
    this.lastClickAt = now;
    try {
      const ctx = this.getOrCreateContext();
      if (ctx.state !== 'running') {
        const pending = ctx.resume();
        void pending.then(() => {
          if (ctx.state === 'running') this.playClickNow(ctx, kind);
        });
        return;
      }
      this.playClickNow(ctx, kind);
    } catch {
      /* ignore WebAudio failures */
    }
  }

  private playClickNow(ctx: AudioContext, kind: 'tick' | 'clunk'): void {
    try {
      const t = ctx.currentTime;
      const master = ctx.createGain();
      const peak =
        kind === 'clunk'
          ? Math.max(0.0001, this.sfxVolume * 0.34)
          : Math.max(0.0001, this.sfxVolume * 0.18);
      const dur = kind === 'clunk' ? 0.07 : 0.034;
      master.gain.setValueAtTime(peak, t);
      master.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      master.connect(ctx.destination);

      const osc = ctx.createOscillator();
      osc.type = kind === 'clunk' ? 'triangle' : 'square';
      osc.frequency.setValueAtTime(kind === 'clunk' ? 180 : 1400, t);
      osc.frequency.exponentialRampToValueAtTime(
        kind === 'clunk' ? 70 : 420,
        t + dur
      );
      osc.connect(master);
      osc.start(t);
      osc.stop(t + dur + 0.02);

      if (kind === 'clunk') {
        const body = ctx.createOscillator();
        const g = ctx.createGain();
        body.type = 'sine';
        body.frequency.setValueAtTime(90, t);
        g.gain.setValueAtTime(0.55, t);
        body.connect(g);
        g.connect(master);
        body.start(t);
        body.stop(t + dur + 0.02);
      }
    } catch {
      /* ignore WebAudio failures */
    }
  }
}

export const audioManager = new AudioManager();

/** Ensure gesture unlock + preload; safe to call repeatedly. */
export function unlockGameAudio(): Promise<void> {
  return audioManager.unlock();
}
