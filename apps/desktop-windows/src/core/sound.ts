// SoundEngine — port of SoundEngine.swift.
// The 29 WAVs are the macOS app's own files (see SOUNDS_DIR in vite.config.ts);
// they are served at /sounds/<name>.wav. Default volume 0.12, slider range 0–0.2,
// exactly like the Mac player, and several sounds may overlap.
// A file of the user's own in the sounds folder (src-tauri/src/sounds.rs)
// replaces a sound; one that doesn't decode falls back to the built-in one.

import { Bridge } from "./bridge";

export const SOUND_NAMES = [
  "peek", "open", "close", "hover", "blip", "slap", "annoyed", "dizzy", "greet",
  "work", "finish", "error", "approval", "question", "approve", "gulp", "tick",
  "send", "love", "pop", "proud", "wink", "yawn", "attach", "think", "search",
  "rate", "sleep", "greeting",
] as const;

export type SoundName = (typeof SOUND_NAMES)[number];

class SoundEngine {
  enabled = true;
  volume = 0.8;

  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private buffers = new Map<string, AudioBuffer>();
  private loading: Promise<void> | null = null;
  private idleTimer: number | null = null;
  /** The sounds a file of the user's own replaces, as last loaded. */
  customized = new Set<string>();
  /** Sounds still playing, by name, so one can be faded out (the greeting). */
  private playing = new Map<string, Set<{ src: AudioBufferSourceNode; gain: GainNode }>>();
  /** Sounds requested before their buffers finished decoding; played as soon as loaded. */
  private pendingPlays = new Map<string, number>();
  /** Voices waiting for a suspended AudioContext to resume, so fadeOut/stopAll can cancel them. */
  private pendingResume = new Map<string, Set<{ cancelled: boolean }>>();

  /** Creates the context and decodes every WAV. Safe to call more than once. */
  preload(): Promise<void> {
    if (this.loading) return this.loading;
    this.loading = (async () => {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      const ctx = new Ctor();
      this.ctx = ctx;
      const master = ctx.createGain();
      master.gain.value = this.volume;
      master.connect(ctx.destination);
      this.master = master;

      const unlockEvents = ["pointerdown", "pointermove", "keydown", "wheel", "mousemove", "mouseenter"] as const;
      const detachUnlock = () => {
        for (const evt of unlockEvents) {
          window.removeEventListener(evt, unlock);
          document.removeEventListener(evt, unlock);
        }
      };
      const unlock = () => {
        if (this.ctx?.state === "running") {
          detachUnlock();
          return;
        }
        if (ctx.state === "suspended") {
          void ctx.resume().then(() => {
            if (this.ctx?.state === "running") detachUnlock();
          });
        }
      };
      if (ctx.state === "suspended") {
        void ctx.resume().then(() => {
          if (this.ctx?.state === "running") detachUnlock();
        });
      }
      for (const evt of unlockEvents) {
        window.addEventListener(evt, unlock, { passive: true });
        document.addEventListener(evt, unlock, { passive: true });
      }

      await this.loadAll(ctx);
    })();
    return this.loading;
  }

  /** Reads the sounds folder again (Settings → Reload sounds). */
  async reload(): Promise<void> {
    await this.preload();
    if (this.ctx) await this.loadAll(this.ctx);
  }

  private async loadSound(ctx: AudioContext, name: string, own: Set<string>, customized: Set<string>) {
    if (own.has(name)) {
      try {
        const bytes = await Bridge.customSound(name);
        if (bytes && bytes.byteLength > 0) {
          const buf = await ctx.decodeAudioData(bytes);
          this.setBuffer(name, buf);
          customized.add(name);
          return;
        }
      } catch {
        /* not a format this webview decodes: the built-in sound stays */
      }
    }

    // Try direct IPC from Tauri memory/disk — eliminates all WebView2 asset fetch hurdles!
    try {
      const bytes = await Bridge.builtinSound(name);
      if (bytes && bytes.byteLength > 0) {
        const buf = await ctx.decodeAudioData(bytes);
        this.setBuffer(name, buf);
        return;
      }
    } catch {
      /* fallback to HTTP fetch */
    }

    for (const url of [`/sounds/${name}.wav`, `sounds/${name}.wav`]) {
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        const buf = await ctx.decodeAudioData(await res.arrayBuffer());
        this.setBuffer(name, buf);
        return;
      } catch {
        /* a missing sound must never break the island */
      }
    }
  }

  private setBuffer(name: string, buf: AudioBuffer) {
    this.buffers.set(name, buf);
    const queuedAt = this.pendingPlays.get(name);
    if (queuedAt != null) {
      this.pendingPlays.delete(name);
      if (performance.now() - queuedAt < 5000) {
        this.play(name);
      }
    }
  }

  private async loadAll(ctx: AudioContext) {
    const own = new Set((await Bridge.customSounds(SOUND_NAMES)) ?? []);
    const customized = new Set<string>();
    // Prioritize loading greeting sound first so launch animation has its audio ready
    await this.loadSound(ctx, "greeting", own, customized);
    // Load all remaining sounds concurrently
    await Promise.all(
      SOUND_NAMES.filter((n) => n !== "greeting").map((name) => this.loadSound(ctx, name, own, customized)),
    );
    this.customized = customized;
  }

  /** WebView2 can hand us a suspended context; call after any user input. */
  resume() {
    if (this.idleTimer != null) {
      window.clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
    void this.ctx?.resume();
  }

  /**
   * Called when the island goes quiet. A running AudioContext keeps an audio
   * thread and its render quantum alive even with nothing playing, which shows
   * up as a steady trickle of CPU on a machine that is supposed to be idle.
   *
   * The delay covers the tail of whatever just played — suspending mid-sound
   * would clip it — and `play()` resumes the context on its own.
   */
  idle() {
    if (!this.ctx || this.ctx.state !== "running" || this.idleTimer != null) return;
    this.idleTimer = window.setTimeout(() => {
      this.idleTimer = null;
      void this.ctx?.suspend();
    }, 30000);
  }

  setVolume(v: number) {
    this.volume = Math.max(0, Math.min(1.0, v));
    if (this.master) this.master.gain.value = this.volume;
  }

  setEnabled(on: boolean) {
    this.enabled = on;
    if (!on) this.stopAll();
  }

  play(name: SoundName | string) {
    if (!this.enabled) return;
    const ctx = this.ctx;
    const master = this.master;
    const buf = this.buffers.get(name);
    if (!ctx || !master || !buf) {
      this.pendingPlays.set(name, performance.now());
      if (!this.loading) void this.preload();
      return;
    }
    if (this.idleTimer != null) {
      window.clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }

    const token = { cancelled: false };
    const startVoice = () => {
      const pending = this.pendingResume.get(name);
      if (pending) {
        pending.delete(token);
        if (pending.size === 0) this.pendingResume.delete(name);
      }
      if (token.cancelled || !this.enabled || !this.ctx || !this.master) return;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const gain = ctx.createGain();
      src.connect(gain);
      gain.connect(master);
      const voice = { src, gain };
      let voices = this.playing.get(name);
      if (!voices) this.playing.set(name, (voices = new Set()));
      voices.add(voice);
      src.onended = () => {
        voices.delete(voice);
        src.disconnect();
        gain.disconnect();
      };
      src.start();
    };

    if (ctx.state === "suspended") {
      let pending = this.pendingResume.get(name);
      if (!pending) this.pendingResume.set(name, (pending = new Set()));
      pending.add(token);
      void ctx.resume().then(startVoice, () => {
        pending?.delete(token);
        if (pending && pending.size === 0) this.pendingResume.delete(name);
      });
    } else {
      startVoice();
    }
  }

  /** Fades every playing copy of `name` to silence over `seconds`, then stops it. */
  fadeOut(name: string, seconds: number) {
    this.pendingPlays.delete(name);
    const pending = this.pendingResume.get(name);
    if (pending) {
      for (const token of pending) token.cancelled = true;
      this.pendingResume.delete(name);
    }
    const ctx = this.ctx;
    const voices = this.playing.get(name);
    if (!ctx || !voices) return;
    const t = ctx.currentTime;
    for (const { src, gain } of voices) {
      gain.gain.cancelScheduledValues(t);
      gain.gain.setValueAtTime(gain.gain.value, t);
      gain.gain.linearRampToValueAtTime(0, t + seconds);
      try {
        src.stop(t + seconds);
      } catch {
        /* already stopped */
      }
    }
  }

  /** Immediately stops all playing and pending sounds. */
  stopAll() {
    this.pendingPlays.clear();
    for (const pending of this.pendingResume.values()) {
      for (const token of pending) token.cancelled = true;
    }
    this.pendingResume.clear();
    for (const voices of this.playing.values()) {
      for (const { src, gain } of voices) {
        try {
          src.stop();
        } catch {
          /* already stopped */
        }
        src.disconnect();
        gain.disconnect();
      }
      voices.clear();
    }
    this.playing.clear();
  }
}

export const Sound = new SoundEngine();
