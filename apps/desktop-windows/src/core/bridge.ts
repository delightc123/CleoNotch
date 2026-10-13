// Thin wrapper over the Tauri commands/events. Every call is a no-op when the
// page is opened in a plain browser, so the island can be iterated on with
// `npm run dev` alone.

import { invoke } from "@tauri-apps/api/core";
import { emitTo, listen } from "@tauri-apps/api/event";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { DEFAULT_SETTINGS, type Settings } from "./state";
import type { RecapHistory, RecapPrefs } from "../recap/summary";
import type { SpotifyState } from "./spotify";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

export const IS_TAURI =
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

let cachedUpdate: Update | null = null;
let stagedUpdate: Update | null = null;

async function call<T>(cmd: string, args?: Record<string, unknown>): Promise<T | null> {
  if (!IS_TAURI) return null;
  try {
    return await invoke<T>(cmd, args);
  } catch (err) {
    console.error(`[cleo] ${cmd} failed`, err);
    return null;
  }
}

export interface BootInfo {
  settings: Settings;
  /** Logical screen rect of the monitor the island lives on. */
  screen: { x: number; y: number; width: number; height: number; scale: number };
  version: string;
  hookPath: string;
  /** False where the OS has no global cursor (Wayland): see Island.followPageCursor. */
  cursorPoll: boolean;
}

export const Bridge = {
  boot: () => {
    if (!IS_TAURI) {
      let s = { ...DEFAULT_SETTINGS };
      try {
        const stored = typeof localStorage !== "undefined" ? localStorage.getItem("cleo_settings") : null;
        if (stored) s = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      } catch {}
      return Promise.resolve<BootInfo>({
        settings: s,
        screen: {
          x: 0,
          y: 0,
          width: typeof window !== "undefined" ? window.screen.width || 1920 : 1920,
          height: typeof window !== "undefined" ? window.screen.height || 1080 : 1080,
          scale: typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1,
        },
        version: "0.3.0 (browser preview)",
        hookPath: "cleo-hook.exe",
        cursorPoll: false,
      });
    }
    return call<BootInfo>("boot");
  },
  /** The system's languages as the webview sees them, for Rust's own texts (i18n.rs). */
  setSystemLanguages: (languages: string[]) => call<void>("set_system_languages", { languages }),

  saveSettings: (settings: Settings) => {
    if (!IS_TAURI) {
      try {
        localStorage.setItem("cleo_settings", JSON.stringify(settings));
        const ch = new BroadcastChannel("cleo_events");
        ch.postMessage({ name: "settings-changed", payload: settings });
        ch.close();
      } catch {}
      return Promise.resolve(null);
    }
    return call<void>("save_settings", { settings });
  },

  /** Shrink the window down to the invisible wake strip (hidden) or back to full. */
  setCollapsed: (collapsed: boolean) => call<void>("set_collapsed", { collapsed }),

  /**
   * Pushes the island shape in window coordinates. Rust flips click-through from
   * its own cursor poll, so the flag is never a frame behind a click.
   */
  setIslandRect: (x: number, y: number, width: number, height: number) =>
    call<void>("set_island_rect", { x, y, width, height }),

  /** Give the window keyboard focus (chat field) and take it away again. */
  focusWindow: (focused: boolean) => call<void>("focus_window", { focused }),

  reposition: () => call<void>("reposition"),

  /** Displays the island can be pinned to: `key` is what `settings.screen` stores. */
  listMonitors: () => {
    if (!IS_TAURI) return Promise.resolve([{ key: "primary", label: "Primary Monitor (Browser)" }]);
    return call<{ key: string; label: string }[]>("list_monitors");
  },

  openUrl: (url: string) => {
    if (!IS_TAURI) {
      window.open(url, "_blank");
      return Promise.resolve(null);
    }
    return call<void>("open_url", { url });
  },

  /** Which of these sounds have a file of the user's own in the sounds folder. */
  customSounds: (names: readonly string[]) => {
    if (!IS_TAURI) return Promise.resolve<string[]>([]);
    return call<string[]>("custom_sounds", { names });
  },
  /** The user's file for one sound, as raw bytes. */
  customSound: (name: string) => call<ArrayBuffer>("custom_sound", { name }),
  /** Built-in sound read directly from Tauri binary or local disk. */
  builtinSound: (name: string) => call<ArrayBuffer>("builtin_sound", { name }),
  revealSoundsFolder: () => call<void>("reveal_sounds_folder"),
  /** Tells the island to read the sounds folder again ("sounds-changed"). */
  reloadSounds: () => call<void>("reload_sounds"),

  /** "Open terminal" → opens the folder in VS Code when `code` is on PATH. */
  openInVSCode: (path: string | null) => call<boolean>("open_in_vscode", { path }),

  /**
   * "Open terminal": the window the session runs in when Rust found it
   * (Windows; Linux on X11 and KDE Plasma), else the folder in VS Code.
   */
  openSession: (sessionId: string | null, path: string | null) =>
    call<boolean>("open_session", { sessionId, path }),

  /** The Claude desktop app, for the Claude Desktop pill (Windows only). */
  openClaudeDesktop: () => call<boolean>("open_claude_desktop"),

  /** The diff card's ↗: an existing file, in VS Code; never launched by its type. */
  openFileInVSCode: (path: string) => call<boolean>("open_file_in_vscode", { path }),

  quit: () => call<void>("quit_app"),

  openSettingsWindow: () => {
    if (!IS_TAURI) {
      const w = window.open("/settings.html", "CleoSettings", "width=560,height=680,menubar=no,toolbar=no,location=no,status=no");
      if (!w) window.open("/settings.html", "_blank");
      return Promise.resolve(null);
    }
    return call<void>("open_settings_window");
  },

  /** Writes to %LOCALAPPDATA%\Cleo\coucou.log, next to the Rust lines. */
  log: (message: string) => call<void>("log_line", { message }),

  // ── Claude Code hooks ─────────────────────────────────────────────────────
  hooksStatus: () => {
    if (!IS_TAURI) {
      return Promise.resolve<HookStatus>({
        installed: false,
        planRelayInstalled: false,
        settingsPath: "~/.claude/settings.json (browser preview)",
        hookPath: "cleo-hook.exe",
        hookReady: true,
      });
    }
    return call<HookStatus>("hooks_status");
  },
  /** Pill ID → whether that agent's hooks reach Cleo (read-only, Mac #183). */
  agentHooksStatus: () => {
    if (!IS_TAURI) return Promise.resolve<Record<string, boolean>>({});
    return call<Record<string, boolean>>("agent_hooks_status");
  },
  /** Diff to show before anything is written. `install: false` previews removal. */
  hooksPreview: (install: boolean) => {
    if (!IS_TAURI) {
      return Promise.resolve<HookPreview>({
        diff: install ? "+ // Cleo hooks added to ~/.claude/settings.json" : "- // Cleo hooks removed",
        backup: "~/.claude/settings.json.backup",
        settingsPath: "~/.claude/settings.json",
        fingerprint: "browser-preview",
      });
    }
    return callOrThrow<HookPreview>("hooks_preview", { install });
  },
  /**
   * Writes ~/.claude/settings.json — only ever after an explicit click, and only
   * when the file still matches the preview the user looked at.
   */
  hooksApply: (install: boolean, fingerprint: string) => {
    if (!IS_TAURI) return Promise.resolve("~/.claude/settings.json.backup");
    return callOrThrow<string>("hooks_apply", { install, fingerprint });
  },

  // ── Other agents (Gemini CLI, Codex, Cursor…) ─────────────────────────────
  agentHooksList: () => {
    if (!IS_TAURI) {
      return Promise.resolve<AgentHookStatus[]>([
        { id: "cursor", name: "Cursor", installed: false, path: "~/.cursor/settings.json", hookReady: true, approvals: true, note: "Browser preview mode" },
        { id: "codex", name: "Codex", installed: false, path: "~/.codex/hooks.json", hookReady: true, approvals: true, note: "Browser preview mode" },
        { id: "gemini", name: "Gemini CLI", installed: false, path: "~/.gemini/hooks.json", hookReady: true, approvals: false, note: "Browser preview mode" },
      ]);
    }
    return call<AgentHookStatus[]>("agent_hooks_list");
  },
  /** Diff to show before anything is written. `install: false` previews removal. */
  agentHooksPreview: (agent: string, install: boolean) => {
    if (!IS_TAURI) {
      return Promise.resolve<AgentHookPlan>({
        diff: install ? `+ // Cleo hooks added for ${agent}` : `- // Cleo hooks removed for ${agent}`,
        backup: `~/.${agent}/config.json.backup`,
        path: `~/.${agent}/config.json`,
        fingerprint: "browser-preview",
      });
    }
    return callOrThrow<AgentHookPlan>("agent_hooks_preview", { agent, install });
  },
  /**
   * Writes the agent's config — only ever after an explicit click, and only when
   * it still matches the preview the user looked at. Returns the backups taken.
   */
  agentHooksApply: (agent: string, install: boolean, fingerprint: string) => {
    if (!IS_TAURI) return Promise.resolve(`~/.${agent}/config.backup`);
    return callOrThrow<string>("agent_hooks_apply", { agent, install, fingerprint });
  },
  // ── Plan usage: the status line relay, installed apart from the hooks ──────
  /** Diff of the status line change. `install: false` previews taking the relay out. */
  statusLinePreview: (install: boolean) => {
    if (!IS_TAURI) {
      return Promise.resolve<HookPreview>({
        diff: install ? "+ statusLine: \"cleo-hook status-line\"" : "- statusLine: \"cleo-hook status-line\"",
        backup: "~/.claude/settings.json.backup",
        settingsPath: "~/.claude/settings.json",
        fingerprint: "browser-preview",
      });
    }
    return callOrThrow<HookPreview>("status_line_preview", { install });
  },
  /** Same rules as hooksApply: an explicit click, and only for the diff that was shown. */
  statusLineApply: (install: boolean, fingerprint: string) => {
    if (!IS_TAURI) return Promise.resolve("~/.claude/settings.json.backup");
    return callOrThrow<string>("status_line_apply", { install, fingerprint });
  },
  /**
   * Asks the Codex CLI (`codex app-server`) for its plan limits, as Codex's
   * /status does. The raw `account/rateLimits/read` result, or null when Codex
   * is missing, not signed in or slow (15 s).
   */
  codexPlanUsage: () => call<unknown>("codex_plan_usage"),

  approvalDecision: (requestId: string, decision: "allow" | "deny") =>
    call<void>("approval_decision", { requestId, decision }),
  /** "The card is up" — until this lands the relay only waits a moment. */
  approvalAck: (requestId: string) => call<void>("approval_ack", { requestId }),
  /** Answers a question Claude Code asked: question text → chosen label. */
  approvalAnswer: (requestId: string, answers: Record<string, string | string[]>) =>
    call<void>("approval_answer", { requestId, answers }),

  /** "Nobody can act on this" — Claude Code asks in the terminal right away. */
  approvalDecline: (requestId: string) => call<void>("approval_decline", { requestId }),

  // ── Chat, files, secrets ──────────────────────────────────────────────────
  /** One chat turn. The API key and any file bytes never leave Rust. */
  chatSend: (query: string, context: ChatContext | null) =>
    callOrThrow<{ text: string }>("chat_send", { query, context }),
  chatReset: () => call<void>("chat_reset"),
  /**
   * The models a provider offers, for the picker in the chat view. Rust asks
   * the provider only when it has a key (or a server address).
   */
  chatModels: (provider: string) => callOrThrow<ModelInfo[]>("chat_models", { provider }),
  /** Settings → Local models → Connect: does the server answer, and with which models? */
  /** The custom server's key, bound to the address it is entered for. */
  localSetKey: (url: string, key: string) => call<void>("local_set_key", { url, key }),

  localConnect: (provider: "ollama" | "lmstudio" | "custom", url: string) =>
    callOrThrow<LocalServer>("local_connect", { provider, url }),
  /** Copies a dropped file into the inbox. */
  ingestFile: (path: string) => callOrThrow<DroppedFile>("ingest_file", { path }),
  /** Only ever tells you whether a key exists — never its value. */
  secretPresent: (key: string) => {
    if (!IS_TAURI) {
      try {
        return Promise.resolve(Boolean(localStorage.getItem(`cleo_secret_${key}`)));
      } catch {
        return Promise.resolve(false);
      }
    }
    return call<boolean>("secret_present", { key });
  },
  secretSet: (key: string, value: string) => {
    if (!IS_TAURI) {
      try {
        localStorage.setItem(`cleo_secret_${key}`, value);
      } catch {}
      return Promise.resolve();
    }
    return callOrThrow<void>("secret_set", { key, value });
  },
  secretClear: (key: string) => {
    if (!IS_TAURI) {
      try {
        localStorage.removeItem(`cleo_secret_${key}`);
      } catch {}
      return Promise.resolve();
    }
    return callOrThrow<void>("secret_clear", { key });
  },

  // ── Integrations ──────────────────────────────────────────────────────────
  refreshIntegration: (id: string) => call<void>("refresh_integration", { id }),
  /** The GitHub card is on screen: refetch that part if it is stale. */
  githubRefresh: (section: "pulse" | "activity") => call<void>("github_refresh", { section }),
  /** Opens the configured n8n instance in the browser. */
  openN8n: () => call<void>("open_n8n"),

  /** Tray → Pause. Stops the integration pollers, not just the island. */
  setPaused: (paused: boolean) => call<void>("set_paused", { paused }),

  // ── Global shortcuts ──────────────────────────────────────────────────────
  /** How each global shortcut went when Rust last registered them. */
  shortcutsStatus: () => {
    if (!IS_TAURI) {
      return Promise.resolve<ShortcutsReport>({
        actions: [],
        blocked: null,
        command: "cleonotch --shortcut",
        portal: null,
      });
    }
    return call<ShortcutsReport>("shortcuts_status");
  },
  /** Lets go of every global shortcut while Settings records a new one. */
  shortcutsSuspend: (suspended: boolean) => call<void>("shortcuts_suspend", { suspended }),

  // ── Weekly recap ──────────────────────────────────────────────────────────
  /** Turns and decisions from `since` (Unix seconds) on, plus the recap prefs. */
  recapHistory: (since: number) => call<RecapHistory>("recap_history", { since: Math.floor(since) }),
  recapPrefs: () => {
    if (!IS_TAURI) return Promise.resolve<RecapPrefs>({ enabled: true, hideProjects: false, lastShownWeek: "" });
    return call<RecapPrefs>("recap_prefs");
  },
  recapSetEnabled: (enabled: boolean) => call<void>("recap_set_enabled", { enabled }),
  recapSetHideProjects: (hide: boolean) => call<void>("recap_set_hide_projects", { hide }),
  /** `week` is the Monday (YYYY-MM-DD) the recap opened on its own for. */
  recapMarkShown: (week: string) => call<void>("recap_mark_shown", { week }),
  recapClear: () => {
    if (!IS_TAURI) return Promise.resolve(null);
    return call<void>("recap_clear");
  },
  /** Writes the PNG (a data URL) into Pictures or Downloads; returns its path. */
  recapSavePng: (data: string, week: string) => callOrThrow<string>("recap_save_png", { data, week }),
  /** Opens the folder of the image saved last. */
  recapRevealSaved: () => call<void>("recap_reveal_saved"),

  // ── Mochi on the desktop (src-tauri/src/desktop.rs) ───────────────────────
  desktopInfo: () => call<DesktopInfo>("desktop_mochi_info"),
  /** Dragged out of the island: (x, y) is the pointer in island-window coordinates. */
  desktopPickUp: (x: number, y: number) => call<boolean>("desktop_mochi_pick_up", { x, y }),
  /** Linux: the pointer moved during that drag (Windows carries him from Rust). */
  desktopCarry: (x: number, y: number) => call<void>("desktop_mochi_carry", { x, y }),
  desktopCarryEnd: (x: number, y: number) => call<void>("desktop_mochi_carry_end", { x, y }),
  /** A drag started on the desktop Mochi; resolves to his top-left corner. */
  desktopDragBegin: () => call<[number, number] | null>("desktop_mochi_drag_begin"),
  /** X11: top-left corner, physical pixels. */
  desktopDragMove: (x: number, y: number) => call<void>("desktop_mochi_drag_move", { x, y }),
  desktopDragEnd: (x: number, y: number) => call<void>("desktop_mochi_drag_end", { x, y }),
  /** From the island to his spot. False: no spot on any connected display.
   *  `anywhere`: the first-visit corner then, rather than staying home. */
  desktopFlyOut: (anywhere = false) => call<boolean>("desktop_mochi_fly_out", { anywhere }),
  /** To the island, then hidden. `forget`: he lives in the island again. */
  desktopFlyHome: (forget: boolean) => call<boolean>("desktop_mochi_fly_home", { forget }),
  /** Asleep, the cursor poll stops. */
  desktopSetAsleep: (asleep: boolean) => call<void>("desktop_mochi_set_asleep", { asleep }),

  // ── Spotify (src-tauri/src/spotify.rs, Linux) ─────────────────────────────
  /** Reads the player again (the card came on screen) and reports it. */
  spotifyRefresh: () => call<SpotifyState | null>("spotify_refresh"),
  /** True when Spotify took it. `value`: seconds for seek, 0/1 for shuffle and repeat, 0…100 for volume. */
  spotifyControl: (action: SpotifyAction, value?: number) =>
    call<boolean>("spotify_control", { action, value: value ?? null }),
  /** Brings Spotify forward or starts it; without it, its download page. */
  spotifyOpen: () => call<boolean>("spotify_open"),
  /** Whether there is a Spotify to launch (Settings). */
  spotifyInstalled: () => call<boolean>("spotify_installed"),

  // ── Auto-Update (Tauri v2 updater plugin) ───────────────────────────
  checkForUpdate: async (): Promise<UpdateCheckResult> => {
    if (!IS_TAURI) {
      return { available: false, currentVersion: "0.3.0" };
    }
    try {
      const update = await check();
      if (!update) {
        cachedUpdate = null;
        stagedUpdate = null;
        return { available: false, currentVersion: (await Bridge.boot())?.version || "0.3.0" };
      }
      if (stagedUpdate && stagedUpdate.version !== update.version) {
        stagedUpdate = null;
      }
      cachedUpdate = update;
      return {
        available: true,
        version: update.version,
        currentVersion: update.currentVersion,
        body: update.body,
        date: update.date,
      };
    } catch (err) {
      console.warn("[cleo] update check failed:", err);
      return { available: false, error: String(err) };
    }
  },

  downloadUpdate: async (
    onProgress?: (progress: UpdateDownloadProgress) => void
  ): Promise<{ ok: boolean; success: boolean; error?: string }> => {
    if (!IS_TAURI) {
      onProgress?.({ downloaded: 100, total: 100, percent: 100 });
      return { ok: true, success: true };
    }
    try {
      let update = cachedUpdate;
      if (!update) {
        update = await check();
        if (!update) return { ok: false, success: false, error: "No update available" };
        cachedUpdate = update;
      }

      if (stagedUpdate && stagedUpdate.version === update.version) {
        onProgress?.({ downloaded: 100, total: 100, percent: 100 });
        return { ok: true, success: true };
      }

      let downloaded = 0;
      let total = 0;

      await update.download((event) => {
        if (event.event === "Started") {
          total = event.data.contentLength ?? 0;
          onProgress?.({
            downloaded: 0,
            total: total > 0 ? total : undefined,
            percent: 0,
          });
        } else if (event.event === "Progress") {
          downloaded += event.data.chunkLength;
          const pct = total > 0 ? Math.min(100, Math.round((downloaded / total) * 100)) : 0;
          onProgress?.({
            downloaded,
            total: total > 0 ? total : undefined,
            percent: pct,
          });
        } else if (event.event === "Finished") {
          onProgress?.({
            downloaded,
            total: total > 0 ? total : undefined,
            percent: 100,
          });
        }
      });

      stagedUpdate = update;
      return { ok: true, success: true };
    } catch (err) {
      console.error("[cleo] download update failed:", err);
      return { ok: false, success: false, error: String(err) };
    }
  },

  installStagedUpdate: async (): Promise<{ ok: boolean; success: boolean; error?: string }> => {
    if (!IS_TAURI) {
      return { ok: true, success: true };
    }
    try {
      if (!stagedUpdate) {
        return { ok: false, success: false, error: "No staged update available" };
      }
      const update = stagedUpdate;
      await update.install();
      stagedUpdate = null;
      return { ok: true, success: true };
    } catch (err) {
      console.error("[cleo] install staged update failed:", err);
      return { ok: false, success: false, error: String(err) };
    }
  },

  downloadAndInstallUpdate: async (
    onProgress?: (progress: UpdateDownloadProgress) => void
  ): Promise<{ success: boolean; error?: string }> => {
    if (!IS_TAURI) {
      onProgress?.({ downloaded: 100, total: 100, percent: 100 });
      return { success: true };
    }
    try {
      if (stagedUpdate) {
        onProgress?.({ downloaded: 100, total: 100, percent: 100 });
        const res = await Bridge.installStagedUpdate();
        return { success: res.ok, error: res.error };
      }

      const dlResult = await Bridge.downloadUpdate(onProgress);

      if (!dlResult.ok) {
        return { success: false, error: dlResult.error };
      }

      const installResult = await Bridge.installStagedUpdate();
      return { success: installResult.ok, error: installResult.error };
    } catch (err) {
      console.error("[cleo] download/install update failed:", err);
      return { success: false, error: String(err) };
    }
  },

  relaunchApp: async (): Promise<void> => {
    if (!IS_TAURI) {
      window.location.reload();
      return;
    }
    try {
      await relaunch();
    } catch (err) {
      console.error("[cleo] relaunch failed:", err);
    }
  },
};

export interface UpdateCheckResult {
  available: boolean;
  version?: string;
  currentVersion?: string;
  body?: string;
  date?: string;
  error?: string;
}

export interface UpdateDownloadProgress {
  downloaded: number;
  total?: number;
  percent: number;
}

export type SpotifyAction = "playPause" | "next" | "previous" | "seek" | "shuffle" | "repeat" | "volume";

export type ShortcutStatus =
  | "active" | "off" | "inUse" | "duplicate" | "invalid"
  | "typesCharacter" | "unsupported" | "notPorted"
  /** Wayland: handed to the desktop's portal, no answer yet / left out by it. */
  | "pending" | "refused";

export interface ShortcutsReport {
  /** `trigger`: on Wayland, the keys the desktop says run it, in its words. */
  actions: { id: string; status: ShortcutStatus; typed?: string; trigger?: string }[];
  /** "wayland" or "no-display" when no key grab can be made. */
  blocked: string | null;
  /** `<executable> --shortcut`: append an action id for a desktop shortcut. */
  command: string;
  /** Wayland: the shortcuts went to the desktop's GlobalShortcuts portal. */
  portal?: "pending" | "active" | null;
}

/** How the desktop Mochi's window works here (platform::DesktopMode). */
export type DesktopMode = "poll" | "window" | "layer" | "off";

export interface DesktopInfo {
  mode: DesktopMode;
  /** He was on the desktop when the app last quit. */
  onDesktop: boolean;
}

/** An event for one window only (island ⇄ desktop Mochi). Never throws. */
export async function emitToWindow(label: string, event: string, payload?: unknown) {
  if (!IS_TAURI) return;
  try {
    await emitTo(label, event, payload);
  } catch (err) {
    console.error(`[coucou] emit ${event} failed`, err);
  }
}

export interface IntegrationUpdate {
  id: string;
  data: Record<string, unknown>;
  error: string | null;
  event: { success: boolean; label: string; detail: string | null } | null;
}

export type ChatContext =
  | { kind: "file"; name: string; path: string }
  | { kind: "window"; appName: string; title: string; url?: string };

export interface ModelInfo {
  id: string;
  label: string;
}

export interface LocalServer {
  /** The address as it is stored. */
  url: string;
  models: string[];
  /** The address is this machine. */
  loopback: boolean;
}

export interface DroppedFile {
  name: string;
  path: string;
  size: number;
}

export interface HookStatus {
  installed: boolean;
  /** Coucou's status line relay (plan usage) is the status line in settings.json. */
  planRelayInstalled: boolean;
  settingsPath: string;
  hookPath: string;
  hookReady: boolean;
}

/** One agent other than Claude Code, as agents.rs reports it. */
export interface AgentHookStatus {
  /** The `--agent` name; its pill is `agent_<id>`. */
  id: string;
  name: string;
  installed: boolean;
  /** The file (or files, one per line) Coucou writes. */
  path: string;
  hookReady: boolean;
  /** The island can allow or deny this agent's permission requests. */
  approvals: boolean;
  /** What to do once it is written. */
  note: string;
}

export interface AgentHookPlan {
  diff: string;
  /** Where each existing file is copied first, one per line; "" when none. */
  backup: string;
  path: string;
  fingerprint: string;
}

export interface HookPreview {
  diff: string;
  backup: string;
  settingsPath: string;
  /** Hand back to hooksApply so only the reviewed diff is ever written. */
  fingerprint: string;
}

/** Same as `call`, but surfaces the error so the UI can show what went wrong. */
async function callOrThrow<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  if (!IS_TAURI) throw new Error("not running inside Cleo");
  return invoke<T>(cmd, args);
}

export type BridgeEvent =
  | { name: "cursor"; payload: { x: number; y: number } }
  | { name: "tray"; payload: string }
  | { name: "hook"; payload: Record<string, unknown> }
  | { name: "screen-changed"; payload: null };

export interface DragDropPayload {
  type: "enter" | "over" | "drop" | "leave";
  paths?: string[];
}

interface WebView2Bridge {
  postMessageWithAdditionalObjects(message: unknown, objects: ArrayLike<unknown>): void;
}

/**
 * Files dragged onto the island. Only reaches us when the window takes the mouse.
 *
 * On Windows WebView2 takes the drop itself, as in Edge — Tauri's drop handling
 * never sees drags from the classic Explorer folder view (see
 * src-tauri/src/webview_drop.rs). Enter/over/leave come straight from the page;
 * the drop hands the File objects to Rust, which answers with their real paths
 * as a `file-drag` event. Elsewhere (Linux) Tauri's own drag events still do it.
 */
export async function onDragDrop(handler: (e: DragDropPayload) => void) {
  if (!IS_TAURI) return () => {};
  const webview = (window as unknown as { chrome?: { webview?: WebView2Bridge } }).chrome?.webview;
  if (!webview) {
    return getCurrentWebview().onDragDropEvent((event) => {
      handler(event.payload as DragDropPayload);
    });
  }
  const hasFiles = (e: DragEvent) => e.dataTransfer?.types.includes("Files") ?? false;
  // dragenter/dragleave fire for every element crossed; only the outermost pair counts.
  let depth = 0;

  const onEnter = (e: DragEvent) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    if (depth++ === 0) handler({ type: "enter" });
  };
  const onOver = (e: DragEvent) => {
    if (!hasFiles(e)) return;
    // Without this WebView2 refuses the drop — or navigates to the file.
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
    handler({ type: "over" });
  };
  const onLeave = (e: DragEvent) => {
    if (!hasFiles(e) || depth === 0) return;
    if (--depth === 0) handler({ type: "leave" });
  };
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    depth = 0;
    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) {
      handler({ type: "drop", paths: [] });
      return;
    }
    webview.postMessageWithAdditionalObjects("cleo-file-drop", files);
  };

  window.addEventListener("dragenter", onEnter);
  window.addEventListener("dragover", onOver);
  window.addEventListener("dragleave", onLeave);
  window.addEventListener("drop", onDrop);
  const unlisten = await listen<DragDropPayload>("file-drag", (e) => handler(e.payload));
  return () => {
    window.removeEventListener("dragenter", onEnter);
    window.removeEventListener("dragover", onOver);
    window.removeEventListener("dragleave", onLeave);
    window.removeEventListener("drop", onDrop);
    unlisten();
  };
}

export async function onEvent<T>(name: string, handler: (payload: T) => void) {
  if (!IS_TAURI) {
    let ch: BroadcastChannel | null = null;
    try {
      ch = new BroadcastChannel("cleo_events");
      ch.onmessage = (e) => {
        if (e.data?.name === name) handler(e.data.payload as T);
      };
    } catch {}
    return () => {
      ch?.close();
    };
  }
  return listen<T>(name, (e) => handler(e.payload));
}
