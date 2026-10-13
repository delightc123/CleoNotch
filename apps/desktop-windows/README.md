<div align="center">

<img src="src-tauri/icons/128x128.png" width="96" alt="Cleo icon">

# Cleo for Windows & Linux

**Mochi doesn't get a physical notch on a PC — so it lives anchored to the top of your screen instead.**

Approve Claude Code permissions, watch your agent work, drop a file, chat with Claude or Gemini, keep an eye on your services — without ever leaving your active editor.

![Windows 10/11](https://img.shields.io/badge/Windows-10%2F11-0078D4?logo=windows)
![Linux](https://img.shields.io/badge/Linux-AppImage%20%7C%20deb%20%7C%20rpm-FCC624?logo=linux&logoColor=black)
![Tauri 2](https://img.shields.io/badge/Tauri-2-FFC131?logo=tauri&logoColor=black)
![Rust](https://img.shields.io/badge/Rust-backend-000?logo=rust)
![License: MIT](https://img.shields.io/badge/license-MIT-green)

</div>

<img src="screenshots/greeting.png" width="640" alt="Mochi waving hello at launch">

---

## What is Cleo?

Cleo is an ambient AI desktop companion built with **Tauri v2 + Rust + Canvas 2D**. It docks smoothly to the top bezel of your display, rendering an unobtrusive productivity HUD that communicates with local AI agents via ultra-low-latency named pipes.

### Key Capabilities

- **Persistent Minimized Notch**: Stays subtly visible on your screen by default (configurable in Settings → General).
- **Expand on Hover**: Hover over the minimized island to smoothly reveal the full HUD with session progress, pills, and Mochi.
- **One-Click Agent Approvals**: Claude Code and Codex permission requests surface instantly with **Allow / Deny / Always** buttons.
- **Context File Dropping**: Drag documents or source files directly onto Mochi to attach them into your agent session.
- **BYOK Privacy Vault**: API keys are locked strictly inside native OS vaults (Windows Credential Manager / Linux Secret Service).

---

## 🛠️ Local Developer Testing & Execution Guide

You do **NOT** need to build or download a production installer to test and develop Cleo on your PC. You can run Cleo in two developer modes:

### Mode 1: Native Desktop HUD (Tauri Dev Mode)

Runs the real desktop app with the transparent always-on-top window, live Win32 Named Pipe listener (`\\.\pipe\cleo`), system tray icon with Mochi, and hotkeys.

**Prerequisites**:
- [Rust toolchain](https://rustup.rs) (`cargo 1.80+`)
- Visual Studio C++ Build Tools ("Desktop development with C++" and Windows 10/11 SDK)
- Node.js 20+ and `pnpm`

```powershell
# From apps/desktop-windows:
pnpm tauri dev

# Or from the repository root:
pnpm --filter cleonotch-windows tauri dev
```

**What happens**:
1. Tauri runs the `predev` script: `cargo build --release -p cleo-hook` to compile `cleo-hook.exe`.
2. Compiles the Rust core (`src-tauri/`) with Tauri v2.
3. Launches the transparent, non-activating always-on-top window anchored at the top of your primary display.
4. Mounts Mochi into your Windows Notification Area (System Tray).
5. Opens named pipe servers: `\\.\pipe\cleo-<SID>` and backward-compatible `\\.\pipe\coucou-<SID>`.

### Mode 2: Rapid In-Browser UI Mode (Vite Live Server)

When tweaking CSS styles, Canvas 2D mascot animations, or layout geometry, you can run the front end directly in your browser without compiling Rust or spawning OS windows.

```powershell
# From apps/desktop-windows:
pnpm dev

# Or from the repository root:
pnpm dev:ui
```

- **Interactive HUD**: Open [http://localhost:1420](http://localhost:1420) to view and test the notch interface with instant Hot Module Replacement (HMR).
- **File Drop Animation Preview**: Open [http://localhost:1420/dev/upload-preview.html](http://localhost:1420/dev/upload-preview.html) to test Mochi's file swallowing sequence on a continuous loop.

---

## Agent Hooks & IPC Protocol

### External Agent Relay (`cleo-hook.exe`)

The relay is a high-speed Rust executable (`cleo-hook.exe`), automatically deployed to:
`%LOCALAPPDATA%\CleoNotch\bin\cleo-hook.exe`

It has a strict 300ms timeout to reach Cleo over named pipes and exits with status 0 if Cleo is closed — **external agent sessions are never blocked or stalled.**

To test dispatching an event into Cleo manually while running:

```powershell
.\target\release\cleo-hook.exe notification '{"title":"Session Start","message":"Agent connected to Cleo!"}'
```

### Claude Code Hook Setup

Open **Settings… → Claude Code → Install hooks…**. You will see the exact diff of what changes in `%USERPROFILE%\.claude\settings.json`, along with a dated automatic backup.

---

## Building Production Installers

```powershell
# Compiles MSI and rolling setup executable into apps/desktop-windows/release/
pnpm pack
```

Generated installer artifacts:
- `Cleo-Windows-X.Y.Z-setup.exe` (versioned installer)
- `Cleo-Windows-setup.exe` (rolling installer)
- `Cleo-Windows.msi` (enterprise MSI package)

---

## Architecture & Layout

```
apps/desktop-windows/
  src/                 Island front end (TypeScript, Canvas 2D, zero heavyweight frameworks)
    mochi/             Mochi expressions & launch greetings in Canvas 2D
    island/            FSM state machine, persistent notch logic, hooks, integrations
    views/             Approval, Chat, File Drop, Ticker, and Settings views
    settings/          Settings window UI and IPC bridge
  src-tauri/           Rust backend: transparent window, named pipe server, secrets, tray
  hook/                cleo-hook.exe, the external agent relay
  scripts/             Icon generation and packaging scripts
```

### Diagnostic Logs

`%LOCALAPPDATA%\CleoNotch\cleonotch.log` — Contains named pipe events, hook dispatches, permission decisions, and poller logs. Everything remains local on your machine.

---

## Linux Support

The exact same codebase compiles natively for Linux! Platform-specific code is isolated in `src-tauri/src/platform/linux.rs` and `hook/src/unix.rs`.

```bash
# Install system dependencies (Debian/Ubuntu)
sudo apt update && sudo apt install -y build-essential pkg-config \
  libwebkit2gtk-4.1-dev libgtk-layer-shell-dev libayatana-appindicator3-dev \
  librsvg2-dev libssl-dev libdbus-1-dev patchelf \
  gstreamer1.0-plugins-base gstreamer1.0-plugins-good

pnpm install
pnpm tauri dev         # Live development build
pnpm pack              # AppImage, .deb, and .rpm in release/
```

- **Wayland Layer Shell**: Anchored to top display edge via `gtk-layer-shell` on COSMIC, KDE Plasma, Hyprland, Sway.
- **Claude Code Hooks**: Dispatches through Unix domain socket at `$XDG_RUNTIME_DIR/cleo.sock`.
- **Credential Storage**: Secret Service API (GNOME Keyring, KWallet).
