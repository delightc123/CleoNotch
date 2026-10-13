# CleoNotch

<div align="center">

<img src="apps/desktop-mac/Assets.xcassets/AppIcon.appiconset/icon_256x256.png" width="96" alt="CleoNotch icon">

**An intelligent on-screen companion that lives in your Mac's notch — or at the top of your screen on Windows and Linux — keeping an eye on your AI coding agent sessions.**

[![macOS 15+](https://img.shields.io/badge/macOS-15%2B-black?logo=apple)](apps/desktop-mac/)
[![Windows 10/11](https://img.shields.io/badge/Windows-10%2F11-0078D4?logo=windows&logoColor=white)](apps/desktop-windows/)
[![Linux](https://img.shields.io/badge/Linux-AppImage%20%7C%20deb%20%7C%20rpm-FCC624?logo=linux&logoColor=black)](apps/desktop-linux/)
[![Swift 6](https://img.shields.io/badge/Swift-6-F05138?logo=swift&logoColor=white)](apps/desktop-mac/)
[![SwiftUI](https://img.shields.io/badge/SwiftUI-native-0A84FF)](apps/desktop-mac/)
[![Tauri 2](https://img.shields.io/badge/Tauri-2-FFC131?logo=tauri&logoColor=black)](apps/desktop-windows/)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-000?logo=nextdotjs&logoColor=white)](apps/landing/)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)

<img src="docs/media/demo.gif" width="760" alt="CleoNotch in action">

</div>

---

## Overview

**CleoNotch** is an open-source, local-first dynamic notch companion designed to seamlessly monitor autonomous AI coding agents (Claude Code, Cursor, Codex, Gemini CLI, Antigravity) directly from your screen bezel. 

Approve permissions with a single click, track real-time file reads/edits/terminal execution, drop files directly into active agent context, and communicate with LLMs — all without interrupting your workflow.

---

## Key Features

- 🤖 **Live Agent Session Monitoring**: Real-time status for Claude Code, Cursor, Codex, Gemini CLI, and Antigravity. Tag hook payloads with `coucou_agent` to grant any agent its own dedicated status pill.
- ✅ **One-Click Notch Approvals**: Permission prompts from Claude Code and Codex surface directly in your notch with instant **Allow / Deny / Always** buttons.
- 🧑‍💻 **Terminal Window Switching**: Immediately focus and jump to the specific terminal window running an active session (*macOS*).
- 💬 **Integrated Model Chat**: Chat with Claude, Gemini, or OpenAI models directly using your personal BYOK API keys stored securely in OS credential stores.
- 📎 **Context Drag & Drop**: Drag documents, source code, or images onto the notch to attach them to your active AI prompt session.
- 🪟 **Window Context Attachment**: Drag the companion onto any active window to automatically capture and append its context (*macOS*).
- 🔌 **Ecosystem Integrations**: Real-time status indicators for GitHub, Vercel deployments, Stripe transactions, n8n workflows, Resend emails, Notion, and Cal.com.
- 🎭 **Organic Micro-Interactions**: Smooth 60 FPS procedural animations, interactive eye tracking following cursor movement, reactive states, and 28 spatial sound effects.
- 🫥 **Zero-Footprint Idle**: Completely recedes into the display notch or top bezel when idle, expanding gracefully on hover or upon incoming agent events.
- 🔒 **BYOK Privacy Invariant**: Zero telemetry and zero third-party accounts. All secret keys are strictly stored in macOS Keychain, Windows Credential Manager, or Linux Secret Service.

---

## Visual Showcase

<table>
<tr>
<td width="50%"><img src="docs/media/claude-code.png" alt="Claude Code session"></td>
<td width="50%"><img src="docs/media/stripe.png" alt="Stripe payments"></td>
</tr>
<tr>
<td width="50%"><img src="docs/media/chat.png" alt="Chat with Claude"></td>
<td width="50%"><img src="docs/media/dizzy.png" alt="Reactive animations"></td>
</tr>
</table>

---

## System Architecture

CleoNotch is engineered with a dual-engine architecture optimized for native platform performance:

```
┌─────────────────────────────────────────────────────────────┐
│                       CleoNotch Runtime                     │
├──────────────────────────────┬──────────────────────────────┤
│      macOS Native Engine     │   Windows & Linux Engine     │
│   • Swift 6 + SwiftUI        │   • Tauri v2 + Rust Core     │
│   • NSPanel Notch Anchoring  │   • Transparent Layer Shell  │
│   • CoreAnimation Timeline   │   • Canvas 2D Procedural VFX │
│   • Unix Domain Sockets      │   • Win32 Named Pipes / IPC  │
└──────────────┬───────────────┴──────────────┬───────────────┘
               │                              │
┌──────────────▼──────────────────────────────▼───────────────┐
│                    Agent Hook Protocols                     │
│    Claude Code • Cursor • Codex • Gemini CLI • Antigravity  │
└─────────────────────────────────────────────────────────────┘
```

---

## Monorepo Architecture

CleoNotch is organized as a high-performance **pnpm + Turborepo monorepo** matching modern production standards:

```
CleoNotch/
  apps/
    desktop-windows/   # Unified Tauri v2 + Rust engine (Windows & Linux HUD)
    desktop-mac/       # Native Swift 6 + SwiftUI companion (macOS notch)
    desktop-linux/     # Linux packaging (AppImage, .deb, .rpm, PKGBUILD)
    landing/           # Next.js 16 interactive web app (heycleo.vercel.app)
    docs/              # Static documentation & API guides
    relay/             # Cloudflare Worker for cross-device state relay
  packages/            # Shared configs, design tokens, outfits
  scripts/             # Sync engine (sync-coucou.mjs), outfit renderers
```

---

## 🛠️ Local Developer Testing & Execution Guide (Windows)

You can run and test Cleo in three distinct modes depending on what you are testing:

### Method 1: Rapid In-Browser UI Testing (`pnpm run dev` or `pnpm dev:ui`)

When designing UI layouts, tweaking CSS styles, or testing Mochi's Canvas 2D expressions and animations without compiling Rust or spawning OS windows:

```powershell
# From root repository:
pnpm dev:ui

# Or inside apps/desktop-windows:
cd apps/desktop-windows
pnpm run dev
```

- **Interactive HUD Canvas**: Open [http://localhost:1420](http://localhost:1420) to view the notch UI with instant Hot Module Replacement (HMR).
- **Settings Panel Parity**: Open [http://localhost:1420/settings.html](http://localhost:1420/settings.html) to test settings without native Tauri.
- **File Drop Choreography Preview**: Open [http://localhost:1420/dev/upload-preview.html](http://localhost:1420/dev/upload-preview.html) to view Mochi's file swallowing animation on a loop.

---

### Method 2: Native Desktop HUD Dev Mode (`pnpm tauri dev` or `pnpm dev:desktop`)

This runs the full native Tauri v2 desktop application with live hot-reloading: a transparent, non-activating always-on-top window docked to the top bezel, Mochi interactive Canvas 2D mascot, system tray icon, and live Win32 Named Pipe listener (`\\.\pipe\cleo`).

```powershell
# From root repository:
pnpm dev:desktop

# Or inside apps/desktop-windows:
cd apps/desktop-windows
pnpm tauri dev
```

**What this does**:
1. Automatically executes `predev` (`cargo build --release -p cleo-hook`) to compile the external agent relay.
2. Compiles the Rust backend (`src-tauri/`) in debug mode and mounts the transparent desktop HUD.
3. Initializes the named pipe server on `\\.\pipe\cleo-<SID>` (with fallback listening on `\\.\pipe\coucou-<SID>`).
4. Mounts the Mochi icon into the Windows Notification Area (System Tray).

---

### Method 3: Production Local Build & Test (`pnpm tauri build` or `pnpm pack:windows`)

This compiles the exact release artifact—a fully optimized standalone executable (`cleonotch.exe`) and Windows installer (`Cleo-Windows.msi` / `Cleo-Windows-setup.exe`) identical to official distributed releases.

```powershell
# From root repository:
pnpm build:desktop      # Compiles standalone release binary in target/release/
pnpm pack:windows       # Generates MSI & NSIS installer in apps/desktop-windows/release/

# Or inside apps/desktop-windows:
cd apps/desktop-windows
pnpm tauri build        # Generates standalone cleonotch.exe & bundle installers
pnpm pack               # Bundles installers into apps/desktop-windows/release/
```

**Output Artifacts**:
- **Standalone Portable App**: `apps/desktop-windows/target/release/cleonotch.exe` (Run immediately by double-clicking!)
- **Windows MSI Installer**: `apps/desktop-windows/release/Cleo-Windows.msi`
- **Windows Setup Installer**: `apps/desktop-windows/release/Cleo-Windows-setup.exe`

---

### Testing Agent Hooks & IPC

To simulate external coding agents (Claude Code, Cursor, Codex) sending commands into Cleo while it is running:

```powershell
# Test via the compiled agent relay
.\apps\desktop-windows\target\release\cleo-hook.exe notification '{"title":"Agent Ready","message":"Claude Code connected to Cleo!"}'
```

---

## 🌐 Interactive Web Landing Page (`apps/landing`)

Cleo's official web landing page is built with Next.js 16 (Turbopack), Tailwind CSS v4, Framer Motion, and `@animateicons/react`. It features a live in-browser notch simulator, procedural Web Audio synthesizer, and animated icons.

- **Live Production URL**: [https://heycleo.vercel.app](https://heycleo.vercel.app)
- **Local Development**:
  ```powershell
  pnpm dev:landing       # Runs Next.js at http://localhost:3000
  pnpm build:landing     # Verifies Next.js Turbopack production build
  ```

---

## Building from Source (All Platforms)

### macOS (Swift 6 & Xcode)

**Prerequisites**: macOS 15+, Xcode 16+, [XcodeGen](https://github.com/yonaskolb/XcodeGen).

```bash
git clone https://github.com/delightc123/CleoNotch.git
cd CleoNotch/apps/desktop-mac
xcodegen
open NotchBuddy.xcodeproj   # Press ⌘R to run
```

### Windows & Linux Packaged Release

```powershell
# Windows MSI and EXE installers
cd apps/desktop-windows
pnpm install
pnpm pack                # Output artifact generated in apps/desktop-windows/release/
```

### Linux (WebKitGTK & GTK Layer Shell)

```bash
sudo apt update && sudo apt install -y build-essential pkg-config \
  libwebkit2gtk-4.1-dev libgtk-layer-shell-dev libayatana-appindicator3-dev \
  librsvg2-dev libssl-dev libdbus-1-dev patchelf \
  gstreamer1.0-plugins-base gstreamer1.0-plugins-good

cd apps/desktop-windows
pnpm install
pnpm pack
```

---

## Configuration & Agent Hooks

Open Settings via the menu bar icon (macOS) or system tray (Windows/Linux) to configure your environment:

| Integration | Functionality | Storage & Verification |
| :--- | :--- | :--- |
| **Claude Code Hooks** | Real-time session monitoring & approval gates | Merges into `~/.claude/settings.json` with automatic backup |
| **Gemini CLI Hooks** | Live Gemini CLI step-by-step telemetry | Configures `~/.gemini/settings.json` |
| **Antigravity Hooks** | Agentic workflows and hook dispatching | Configures `~/.gemini/config/hooks.json` |
| **Anthropic / OpenAI / Gemini** | Direct model chat & contextual file analysis | Stored locally in OS Keychain / Credential Manager |
| **Services (GitHub, Stripe, etc.)** | Ambient webhook monitoring pills | Secure local storage; active only when enabled |

> **Fail-Safe Guarantee**: If CleoNotch is not running, hook relays exit immediately without blocking Claude Code or any connected terminal sessions.

---

## Contributing

Contributions are welcomed! Feel free to submit pull requests for new agent integrations, UI themes, or performance enhancements. Please review [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

---

## License & Attribution

- **Source Code**: [MIT License](LICENSE) — Copyright © 2026 **Delight Chukwu** ([@delightc123](https://github.com/delightc123)).
- **Media & Assets**: See [LICENSE-ASSETS.md](LICENSE-ASSETS.md).
- Developed on top of the open-source Coucou architecture by Louis Raillé.
