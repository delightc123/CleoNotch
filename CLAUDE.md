# Cleo (CleoNotch) — Guide for AI Coding Agents

Cleo (CleoNotch) is an ambient AI desktop companion and productivity HUD created by Delight Chukwu, built upon the upstream Coucou architecture by Louis Raillé. It features dual native engines: a pure Swift 6 macOS notch HUD (`apps/desktop-mac/`) and a Tauri v2 + Rust HUD for Windows and Linux (`apps/desktop-windows/`). Mochi, an animated companion living in your notch, visualizes AI coding agent sessions (Claude Code, Gemini CLI, Antigravity, Cursor, Codex) and system integrations, enabling one-click approvals, terminal answers, chat, and file drops.

## Monorepo Architecture & Directory Layout
- `apps/desktop-mac/` — Native macOS Swift 6 app (AppKit + SwiftUI Canvas timeline rendering). `Sources/App/` (Mac-only HUD), `Sources/CoucouKit/` (shared Mochi engine, wardrobe outfits, pills, diff parser, models). XcodeGen configured via `apps/desktop-mac/project.yml`.
- `apps/desktop-windows/` — Unified Windows & Linux Tauri v2 engine: Rust backend in `src-tauri/`, TypeScript UI & Canvas 2D in `src/`, and the local agent hook relay (`cleo-hook` / `coucou-hook`) in `hook/`.
- `apps/landing/` — Next.js 16 + React 19 interactive browser simulator with Arc-inspired fluid canvas, live Mochi canvas, and sound synth.
- `apps/relay/` — Stateless Cloudflare Worker push relay for remote mobile notifications.
- `apps/docs/` — Public site documents and disclosures (privacy, terms, legal notice).
- `scripts/` — Turnkey release, outfit rendering, and upstream sync automation (`sync-coucou.mjs`).
- `tests/` — Swift test suites verifying screen geometry, diff engine, and pill palette consistency.

## Local Development & Build Commands
- **Root Workspace Commands (PNPM)**:
  - Run Windows/Linux desktop HUD in dev mode: `pnpm dev:desktop`
  - Run Windows UI in rapid browser mode: `pnpm dev`
  - Run Next.js interactive landing preview: `pnpm dev:landing`
  - Run unit test suite (367 unit tests): `pnpm test`
  - Build Windows production release installer: `pnpm pack:windows`
- **macOS Native Build**:
  ```bash
  cd apps/desktop-mac && xcodegen && xcodebuild -scheme NotchBuddy -configuration Debug build
  ```

## Invariants & Rules of the House
- **Swift Concurrency**: Swift 6 with `-strict-concurrency=complete`. Pure SwiftUI + AppKit. Zero third-party dependencies on macOS.
- **BYOK Privacy & Security**: User API secrets strictly live inside native OS vaults (macOS Keychain, Windows Credential Manager). Never write unencrypted credentials to disk or transmit telemetry.
- **Fail-Safe Hooks**: If the desktop HUD is not running or socket/pipe connections fail, agent hook relays (`cleo-hook.exe`, `coucou-hook.exe`) must exit cleanly with status code 0 so external agent processes are never stalled.
- **Bundle Identifiers**: macOS bundle ID is `com.delight.CleoNotch`; Windows identifier is `com.delight.cleonotch`.
- **Identity & Provenance**: Author and project maintainer is Delight Chukwu ([@delightc123](https://github.com/delightc123)). Upstream Coucou provenance is preserved in `.context/coucou/` and `LICENSE-ASSETS.md`.
