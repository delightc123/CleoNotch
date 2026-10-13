# Contributing to Cleo (CleoNotch)

Thanks for wanting to help Cleo & Mochi grow! 🫶

## Getting Started

### macOS Native Development
```bash
brew install xcodegen
cd apps/desktop-mac && xcodegen && open NotchBuddy.xcodeproj
```
*Never edit `NotchBuddy.xcodeproj` directly: change `apps/desktop-mac/project.yml` and run `xcodegen`.*

Check resting island dimensions on screens with and without a notch:
```bash
bash scripts/test-screen-geometry.sh
bash scripts/test-display-choice.sh
```

### Windows & Linux Development
```bash
pnpm install
pnpm dev:desktop     # Launch native desktop HUD in Tauri dev mode
pnpm dev             # Rapid in-browser UI testing
pnpm test            # Run 367 unit tests
```

## Good First Contributions
- A new service integration (a poller + an entry in `PillCatalog.swift` or `integrations.ts` + a detail card).
- A new AI agent integration: any agent automatically receives a pill by sending `coucou_agent` or `cleo_agent` in its hook payload.
- A new emote, sound, or outfit wardrobe asset for Mochi.
- Bug fixes — please include tests and reproduction steps.

## Rules of the House
- **Pure Swift 6 & Tauri v2**: Zero third-party dependencies on macOS. Native Win32 / Linux Wayland windowing on Tauri.
- **Strict Privacy**: Secrets belong in the OS vault (Keychain, Windows Credential Manager), never in unencrypted files or Git.
- **Fail-Safe Relay**: External agent processes (Claude Code, Cursor, Codex) must never be blocked if the HUD is offline.
- **Performance Invariant**: 0% CPU consumption when the island is minimized or idle.

## Pull Requests
- Keep PRs focused to a single feature or bugfix.
- All workspace tests (`pnpm test` and `xcodebuild`) must pass with zero new warnings.
