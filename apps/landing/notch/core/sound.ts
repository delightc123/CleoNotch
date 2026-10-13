// SoundEngine — port of SoundEngine.swift with robust browser Web Audio + HTML5 audio playback.
// The 29 WAVs are the macOS app's own files; they are served at /sounds/<name>.wav.
// Default volume 0.12, slider range 0–0.2, exactly like the Mac player.

import { Bridge } from "./bridge";

export const SOUND_NAMES = [
  "peek", "open", "close", "hover", "blip", "slap", "annoyed", "dizzy", "greet",
  "work", "finish", "error", "approval", "question", "approve", "gulp", "tick",
  "send", "love", "pop", "proud", "wink", "yawn", "attach", "think", "search",
  "rate", "sleep", "greeting",
] as const;

export type SoundName = (typeof SOUND_NAMES)[number];

interface PendingPlay {
  requestedAt: number;
  maxAgeMs: number;
}

interface PendingVoice {
  abort: () => void;
}

const UNLOCK_EVENTS = [
  "pointerdown",
  "pointermove",
  "mousemove",
  "keydown",
  "wheel",
  "touchstart",
  "focus",
  "click",
] as const;

class SoundEngine {
  enabled = true;
  volume = 0.80;

  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private buffers = new Map<string, AudioBuffer>();
  private loading: Promise<void> | null = null;
  private greetingPromise: Promise<void> | null = null;
  private idleTimer: number | null = null;
  private pendingPlays = new Map<string, PendingPlay>();
  private pendingVoices = new Map<string, Set<PendingVoice>>();
  private activeHtmlGreeting: HTMLAudioElement | null = null;
  private htmlGreetingCancelled = false;
  private unlockListenersAttached = false;
  private unlockHandler: (() => void) | null = null;

  /** The sounds a file of the user's own replaces, as last loaded. */
  customized = new Set<string>();
  /** Sounds still playing, by name, so one can be faded out (the greeting). */
  private playing = new Map<string, Set<{ src: AudioBufferSourceNode; gain: GainNode }>>();

  constructor() {
    this.attachAmbientUnlockListeners();
  }

  ensureContext(): AudioContext | null {
    if (this.ctx) return this.ctx;
    if (typeof window === "undefined") return null;
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    const ctx = new Ctor();
    this.ctx = ctx;
    const master = ctx.createGain();
    master.gain.value = this.volume;
    master.connect(ctx.destination);
    this.master = master;
    return ctx;
  }

  private detachAmbientUnlockListeners() {
    if (typeof window === "undefined" || !this.unlockListenersAttached || !this.unlockHandler) return;
    for (const evt of UNLOCK_EVENTS) {
      window.removeEventListener(evt, this.unlockHandler);
      document.removeEventListener(evt, this.unlockHandler);
    }
    this.unlockListenersAttached = false;
    this.unlockHandler = null;
  }

  private attachAmbientUnlockListeners() {
    if (typeof window === "undefined" || this.unlockListenersAttached) return;
    this.unlockListenersAttached = true;

    const unlockHandler = () => {
      this.resume();
      // If greeting was requested while autoplay was restricted, trigger it now
      const pendingGreeting = this.pendingPlays.get("greeting");
      if (pendingGreeting && performance.now() - pendingGreeting.requestedAt < pendingGreeting.maxAgeMs) {
        this.pendingPlays.delete("greeting");
        this.playNow("greeting");
      }
      if (this.ctx?.state === "running") {
        this.detachAmbientUnlockListeners();
      }
    };
    this.unlockHandler = unlockHandler;

    for (const evt of UNLOCK_EVENTS) {
      window.addEventListener(evt, unlockHandler, { passive: true });
      document.addEventListener(evt, unlockHandler, { passive: true });
    }
  }

  /**
   * Preload the high-priority entrance greeting sound immediately.
   */
  async preloadGreeting(): Promise<void> {
    if (this.buffers.has("greeting")) return;
    if (this.greetingPromise) return this.greetingPromise;

    this.greetingPromise = (async () => {
      const ctx = this.ensureContext();
      if (!ctx) return;
      await this.loadSingleSound(ctx, "greeting");
    })();

    return this.greetingPromise;
  }

  /** Creates the context and decodes every WAV. Safe to call more than once. */
  preload(): Promise<void> {
    if (this.loading) return this.loading;
    this.loading = (async () => {
      const ctx = this.ensureContext();
      if (!ctx) return;

      // 1. Fetch greeting immediately
      await this.preloadGreeting();

      // 2. Fetch all other sounds in parallel
      await this.loadAllRemaining(ctx);
    })();
    return this.loading;
  }

  /** Reads the sounds folder again (Settings → Reload sounds). */
  async reload(): Promise<void> {
    await this.preload();
    if (this.ctx) await this.loadAllRemaining(this.ctx);
  }

  private async loadSingleSound(ctx: AudioContext, name: string) {
    if (this.buffers.has(name)) return;
    try {
      const res = await fetch(`/sounds/${name}.wav`);
      if (!res.ok) return;
      const arrayBuffer = await res.arrayBuffer();
      const buf = await ctx.decodeAudioData(arrayBuffer);
      this.buffers.set(name, buf);

      // Check if this sound was requested while loading
      const pending = this.pendingPlays.get(name);
      if (pending) {
        this.pendingPlays.delete(name);
        const elapsed = performance.now() - pending.requestedAt;
        if (elapsed < pending.maxAgeMs) {
          this.playNow(name);
        }
      }
    } catch {
      /* Missing or undecodable sound must never crash the UI */
    }
  }

  private async loadAllRemaining(ctx: AudioContext) {
    const own = new Set((await Bridge.customSounds(SOUND_NAMES)) ?? []);
    const customized = new Set<string>();

    await Promise.all(
      SOUND_NAMES.map(async (name) => {
        if (own.has(name)) {
          try {
            const bytes = await Bridge.customSound(name);
            if (bytes && bytes.byteLength > 0) {
              this.buffers.set(name, await ctx.decodeAudioData(bytes));
              customized.add(name);
              return;
            }
          } catch {
            /* Fallback to built-in */
          }
        }
        await this.loadSingleSound(ctx, name);
      }),
    );

    this.customized = customized;
  }

  /** WebView2 / Browser can suspend the context; resume on any user activity. */
  resume() {
    if (this.idleTimer != null) {
      window.clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
    if (this.ctx && this.ctx.state === "suspended") {
      void this.ctx.resume().then(() => {
        if (this.ctx?.state === "running") {
          this.detachAmbientUnlockListeners();
        }
      }).catch(() => {});
    } else if (this.ctx?.state === "running") {
      this.detachAmbientUnlockListeners();
    }
  }

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
    if (this.activeHtmlGreeting) this.activeHtmlGreeting.volume = this.volume;
  }

  setEnabled(on: boolean) {
    this.enabled = on;
    if (!on) this.stopAll();
  }

  /** Immediately stops all playing and pending sounds. */
  stopAll() {
    this.pendingPlays.clear();
    for (const pending of this.pendingVoices.values()) {
      for (const token of pending) token.abort();
      pending.clear();
    }
    this.pendingVoices.clear();
    this.htmlGreetingCancelled = true;
    if (this.activeHtmlGreeting) {
      this.activeHtmlGreeting.pause();
      this.activeHtmlGreeting = null;
    }
    for (const voices of this.playing.values()) {
      for (const { src, gain } of voices) {
        try {
          src.stop();
        } catch (err) {
          void err;
        }
        src.disconnect();
        gain.disconnect();
      }
      voices.clear();
    }
    this.playing.clear();
  }

  play(name: SoundName | string) {
    if (!this.enabled) return;

    const buf = this.buffers.get(name);
    if (!buf) {
      // Sound is still loading: queue it so it plays as soon as decoding finishes!
      this.pendingPlays.set(name, {
        requestedAt: performance.now(),
        maxAgeMs: name === "greeting" ? 4000 : 800,
      });

      // Ensure loading is actively triggered
      if (name === "greeting") {
        void this.preloadGreeting();
      } else {
        void this.preload();
      }
      return;
    }

    this.playNow(name);
  }

  private playNow(name: SoundName | string) {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    const master = this.master;
    const buf = this.buffers.get(name);
    if (!ctx || !master || !buf) return;

    if (this.idleTimer != null) {
      window.clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }

    // For greeting: if context is suspended due to strict autoplay policies,
    // also attempt HTML5 Audio as a dual-channel fallback
    if (name === "greeting" && ctx.state === "suspended") {
      this.htmlGreetingCancelled = false;
      try {
        const audio = new Audio("/sounds/greeting.wav");
        audio.volume = this.volume;
        audio.play().then(() => {
          if (this.htmlGreetingCancelled) {
            audio.pause();
            return;
          }
          this.activeHtmlGreeting = audio;
        }).catch(() => {
          if (this.htmlGreetingCancelled) return;
          // Both Web Audio and HTML5 were held by browser policy: keep in pendingPlays
          // so the very first pointermove or keydown triggers playback
          this.pendingPlays.set("greeting", {
            requestedAt: performance.now(),
            maxAgeMs: 4000,
          });
        });
      } catch {
        /* Browser policy fallback */
      }
    }

    const startVoice = () => {
      if (!this.enabled || !this.ctx || !this.master) return;
      try {
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
          voices?.delete(voice);
          src.disconnect();
          gain.disconnect();
        };
        src.start();
      } catch {
        /* Audio source start error handled */
      }
    };

    if (ctx.state === "suspended") {
      let aborted = false;
      const token: PendingVoice = {
        abort: () => {
          aborted = true;
        },
      };
      let pending = this.pendingVoices.get(name);
      if (!pending) this.pendingVoices.set(name, (pending = new Set()));
      pending.add(token);

      void ctx.resume().then(() => {
        pending?.delete(token);
        if (ctx.state === "running") {
          this.detachAmbientUnlockListeners();
        }
        if (!aborted) {
          startVoice();
        }
      }).catch(() => {
        pending?.delete(token);
      });
    } else {
      this.detachAmbientUnlockListeners();
      startVoice();
    }
  }

  /**
   * Mechanical typewriter keystroke click sound with slight random pitch variation.
   * Generates a pure pitch-bent synthetic tick when the AudioContext is running.
   */
  playTypewriterClick(index = 0) {
    if (!this.enabled) return;
    if (this.idleTimer !== null) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
    const ctx = this.ensureContext();
    const master = this.master;
    if (!ctx || !master) return;
    if (ctx.state !== "running") {
      void ctx.resume().catch(() => {});
      return;
    }
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      const freq = 640 + (index % 4) * 12 + (Math.random() * 80 - 40);
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.03);
      g.gain.setValueAtTime(0.09, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      osc.connect(g);
      g.connect(master);
      osc.onended = () => {
        osc.disconnect();
        g.disconnect();
        this.idle();
      };
      osc.start(now);
      osc.stop(now + 0.035);
    } catch (err) {
      void err;
    }
  }

  /**
   * Harmonic shimmer chime upon completing the entrance "Hey Cleo!" write-up.
   * Generates a pure 3-note harmonic triad chord when the AudioContext is running.
   */
  playCompletionChime() {
    if (!this.enabled) return;
    if (this.idleTimer !== null) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
    const ctx = this.ensureContext();
    const master = this.master;
    if (!ctx || !master) return;
    if (ctx.state !== "running") {
      void ctx.resume().catch(() => {});
      return;
    }
    try {
      const now = ctx.currentTime;
      [587.33, 880, 1174.66].forEach((f, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(f, now + i * 0.04);
        g.gain.setValueAtTime(0.05, now + i * 0.04);
        g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.04 + 0.4);
        osc.connect(g);
        g.connect(master);
        osc.onended = () => {
          osc.disconnect();
          g.disconnect();
          this.idle();
        };
        osc.start(now + i * 0.04);
        osc.stop(now + i * 0.04 + 0.45);
      });
    } catch (err) {
      void err;
    }
  }

  /** Fades every playing copy of `name` to silence over `seconds`, then stops it. */
  fadeOut(name: string, seconds: number) {
    this.pendingPlays.delete(name);
    const pending = this.pendingVoices.get(name);
    if (pending) {
      for (const token of pending) token.abort();
      pending.clear();
      this.pendingVoices.delete(name);
    }

    if (name === "greeting") {
      this.htmlGreetingCancelled = true;
    }

    // Fade out HTML5 Audio fallback if active
    if (name === "greeting" && this.activeHtmlGreeting) {
      const audio = this.activeHtmlGreeting;
      this.activeHtmlGreeting = null;
      const startVol = audio.volume;
      const steps = 10;
      const stepDuration = (seconds * 1000) / steps;
      let currentStep = 0;
      const timer = window.setInterval(() => {
        currentStep++;
        const factor = Math.max(0, 1 - currentStep / steps);
        audio.volume = startVol * factor;
        if (currentStep >= steps) {
          window.clearInterval(timer);
          audio.pause();
        }
      }, stepDuration);
    }

    // Fade out Web Audio voices
    const ctx = this.ctx;
    const voices = this.playing.get(name);
    if (!ctx || !voices) return;
    const t = ctx.currentTime;
    for (const { src, gain } of voices) {
      try {
        gain.gain.cancelScheduledValues(t);
        gain.gain.setValueAtTime(gain.gain.value, t);
        gain.gain.linearRampToValueAtTime(0, t + seconds);
        src.stop(t + seconds);
      } catch {
        /* already stopped */
      }
    }
  }
}

export const Sound = new SoundEngine();
