#!/usr/bin/env node
// CleoNotch — Upstream Coucou Sync & Backport Engine (Monorepo Edition)
// Author: Delight Chukwu (@delightc123)
// Usage: node scripts/sync-coucou.mjs [--source "C:\\Software\\CLONED\\coucou"] [--dry-run]

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const forceOverwrite = args.includes("--force-overwrite");
const sourceIdx = args.indexOf("--source");
const SOURCE = sourceIdx !== -1 && args[sourceIdx + 1] 
  ? path.resolve(args[sourceIdx + 1])
  : path.resolve("C:/Software/CLONED/coucou");

console.log("=================================================");
console.log("   CleoNotch — Upstream Synchronization Engine   ");
console.log("=================================================");
console.log(`Source Upstream : ${SOURCE}`);
console.log(`Destination     : ${ROOT}`);
console.log(`Mode            : ${dryRun ? "DRY RUN (No writes)" : "LIVE SYNC"}${forceOverwrite ? " (FORCE OVERWRITE)" : ""}\n`);

if (!fs.existsSync(SOURCE)) {
  console.error(`[ERROR] Upstream source path does not exist: ${SOURCE}`);
  process.exit(1);
}

// Protected files & directories that must NEVER be overwritten by upstream
const PROTECTED_PATHS = new Set([
  ".git",
  ".github",
  ".context",
  ".memory",
  ".rules",
  ".myFiles",
  "notes",
  "memory.md",
  "AGENTS.md",
  "node_modules",
  "target",
  "dist",
  ".next",
  "landing",
  ".DS_Store",
]);

// Core downstream-customized Cleo files protected unless --force-overwrite is passed
const PROTECTED_DOWNSTREAM_FILES = new Set([
  "apps/desktop-windows/src/island/fsm.ts",
  "apps/desktop-windows/src/island/island.ts",
  "apps/desktop-windows/src/core/sound.ts",
  "apps/desktop-windows/src/core/bridge.ts",
  "apps/desktop-windows/src/core/state.ts",
  "apps/desktop-windows/src/core/layout.ts",
  "apps/desktop-windows/src/core/shortcuts.ts",
  "apps/desktop-windows/src/views/icons.ts",
  "apps/desktop-windows/src/views/dom.ts",
  "apps/desktop-windows/src/style.css",
  "apps/desktop-windows/src/main.ts",
  "apps/desktop-windows/src/settings/main.ts",
  "apps/desktop-windows/src/locales/extra.json",
  "apps/desktop-windows/src-tauri/src/platform/windows.rs",
  "apps/desktop-windows/src-tauri/src/sounds.rs",
  "apps/desktop-windows/src-tauri/src/pipe.rs",
  "apps/desktop-windows/src-tauri/src/shortcuts.rs",
  "apps/desktop-windows/src-tauri/src/settings.rs",
  "apps/desktop-windows/src-tauri/src/island.rs",
  "apps/desktop-windows/src-tauri/src/agent_hooks.rs",
  "apps/desktop-windows/src-tauri/tauri.conf.json",
  "apps/desktop-windows/tests/fsm.test.mjs",
  "apps/desktop-windows/tests/shortcuts.test.mjs",
  "apps/desktop-windows/scripts/pack.mjs",
  "apps/desktop-windows/scripts/run-tauri.mjs",
  "apps/desktop-windows/scripts/build-hook.mjs",
  "scripts/sync-coucou.mjs",
]);

// Subsystems mapping upstream directories to monorepo layout
const SYNC_DIRECTORIES_MAP = [
  { src: "windows", dest: "apps/desktop-windows" },
  { src: "NotchBuddy", dest: "apps/desktop-mac" },
  { src: "relay", dest: "apps/relay" },
  { src: "linux", dest: "apps/desktop-linux" },
  { src: "docs", dest: "apps/docs" },
  { src: "scripts", dest: "scripts" },
  { src: "tests", dest: "tests" },
  { src: "design", dest: "design" },
];

let addedCount = 0;
let updatedCount = 0;
let skippedCount = 0;

function shouldSkip(relPath) {
  const parts = relPath.split(/[/\\]/);
  for (const part of parts) {
    if (PROTECTED_PATHS.has(part)) return true;
    if (part === "node_modules" || part === "target" || part === "dist" || part === ".next") return true;
  }
  return false;
}

function syncRecursive(srcDir, destDir, baseRel = "") {
  if (!fs.existsSync(srcDir)) return;
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    const relPath = path.join(baseRel, entry.name);
    const normalizedRelPath = relPath.replace(/\\/g, "/");

    if (shouldSkip(relPath)) {
      skippedCount++;
      continue;
    }

    if (entry.isDirectory()) {
      if (!fs.existsSync(destPath) && !dryRun) {
        fs.mkdirSync(destPath, { recursive: true });
      }
      syncRecursive(srcPath, destPath, relPath);
    } else if (entry.isFile()) {
      const srcContent = fs.readFileSync(srcPath);
      let needsCopy = false;

      if (!fs.existsSync(destPath)) {
        needsCopy = true;
        addedCount++;
        console.log(`[+] Added: ${normalizedRelPath}`);
      } else {
        const destContent = fs.readFileSync(destPath);
        if (!srcContent.equals(destContent)) {
          if (!forceOverwrite && PROTECTED_DOWNSTREAM_FILES.has(normalizedRelPath)) {
            skippedCount++;
            console.log(`[PROTECTED] Skipped downstream customized file: ${normalizedRelPath}`);
            continue;
          }
          needsCopy = true;
          updatedCount++;
          console.log(`[~] Updated: ${normalizedRelPath}`);
        }
      }

      if (needsCopy && !dryRun) {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
}

// 1. Run file sync across directories
for (const item of SYNC_DIRECTORIES_MAP) {
  const src = path.join(SOURCE, item.src);
  const dest = path.join(ROOT, item.dest);
  syncRecursive(src, dest, item.dest);
}

// 2. Also check root files
const ROOT_FILES = ["README.md", "LICENSE", "CHANGELOG.md"];
for (const file of ROOT_FILES) {
  const src = path.join(SOURCE, file);
  const dest = path.join(ROOT, file);
  if (fs.existsSync(src) && !fs.existsSync(dest)) {
    if (!dryRun) fs.copyFileSync(src, dest);
    console.log(`[+] Copied root file: ${file}`);
  }
}

console.log("\n-------------------------------------------------");
console.log(`Sync Summary: ${addedCount} added, ${updatedCount} updated, ${skippedCount} skipped`);
console.log("-------------------------------------------------\n");

if (!dryRun) {
  console.log("[*] Re-asserting Cleo branding & custom configurations...");

  // Assert apps/desktop-windows package.json
  const pkgPath = path.join(ROOT, "apps", "desktop-windows", "package.json");
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    pkg.name = "cleonotch-windows";
    pkg.author = "Delight Chukwu";
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
    console.log("  ✔ apps/desktop-windows/package.json (cleonotch-windows / Delight Chukwu)");
  }

  // Assert tauri.conf.json
  const tauriConfPath = path.join(ROOT, "apps", "desktop-windows", "src-tauri", "tauri.conf.json");
  if (fs.existsSync(tauriConfPath)) {
    const conf = JSON.parse(fs.readFileSync(tauriConfPath, "utf-8"));
    conf.productName = "CleoNotch";
    conf.identifier = "com.delight.cleonotch";
    if (conf.bundle?.copyright) conf.bundle.copyright = "© 2026 Delight Chukwu";
    fs.writeFileSync(tauriConfPath, JSON.stringify(conf, null, 2) + "\n");
    console.log("  ✔ apps/desktop-windows/src-tauri/tauri.conf.json (CleoNotch / com.delight.cleonotch)");
  }

  // Assert Cargo.toml package name
  const cargoPath = path.join(ROOT, "apps", "desktop-windows", "src-tauri", "Cargo.toml");
  if (fs.existsSync(cargoPath)) {
    let cargo = fs.readFileSync(cargoPath, "utf-8");
    cargo = cargo.replace(/name\s*=\s*"coucou"/, 'name = "cleonotch"');
    cargo = cargo.replace(/name\s*=\s*"coucou_lib"/, 'name = "cleonotch_lib"');
    cargo = cargo.replace(/authors\s*=\s*\["[^"]*"\]/, 'authors = ["Delight Chukwu"]');
    fs.writeFileSync(cargoPath, cargo);
    console.log("  ✔ apps/desktop-windows/src-tauri/Cargo.toml (cleonotch / Delight Chukwu)");
  }

  // Assert hook Cargo.toml
  const hookCargoPath = path.join(ROOT, "apps", "desktop-windows", "hook", "Cargo.toml");
  if (fs.existsSync(hookCargoPath)) {
    let hookCargo = fs.readFileSync(hookCargoPath, "utf-8");
    hookCargo = hookCargo.replace(/name\s*=\s*"coucou-hook"/g, 'name = "cleo-hook"');
    fs.writeFileSync(hookCargoPath, hookCargo);
    console.log("  ✔ apps/desktop-windows/hook/Cargo.toml (cleo-hook)");
  }

  // Assert desktop-mac project.yml
  const projectYmlPath = path.join(ROOT, "apps", "desktop-mac", "project.yml");
  if (fs.existsSync(projectYmlPath)) {
    let yml = fs.readFileSync(projectYmlPath, "utf-8");
    yml = yml.replace(/bundleIdPrefix:\s*fr\.louisraille/, "bundleIdPrefix: com.delight");
    fs.writeFileSync(projectYmlPath, yml);
    console.log("  ✔ apps/desktop-mac/project.yml (com.delight bundle prefix)");
  }

  // Assert scripts/ path mappings to monorepo
  const scriptsDirPath = path.join(ROOT, "scripts");
  if (fs.existsSync(scriptsDirPath)) {
    const shFiles = fs.readdirSync(scriptsDirPath).filter(f => f.endsWith(".sh"));
    let sanitizedCount = 0;
    for (const shFile of shFiles) {
      const shPath = path.join(scriptsDirPath, shFile);
      let content = fs.readFileSync(shPath, "utf-8");
      let changed = false;
      if (content.includes("NotchBuddy/Sources/")) {
        content = content.replaceAll("NotchBuddy/Sources/", "apps/desktop-mac/Sources/");
        changed = true;
      }
      if (content.includes('cd "$REPO_ROOT/NotchBuddy"')) {
        content = content.replaceAll('cd "$REPO_ROOT/NotchBuddy"', 'cd "$REPO_ROOT/apps/desktop-mac"');
        changed = true;
      }
      if (content.includes("NotchBuddy/project.yml")) {
        content = content.replaceAll("NotchBuddy/project.yml", "apps/desktop-mac/project.yml");
        changed = true;
      }
      if (changed) {
        fs.writeFileSync(shPath, content, "utf-8");
        sanitizedCount++;
      }
    }
    console.log(`  ✔ scripts/ path sanitization (${sanitizedCount} scripts mapped to apps/desktop-mac)`);
  }

  console.log("\n[*] Running automated verification test suite...");
  try {
    execSync("pnpm test", { cwd: ROOT, encoding: "utf-8" });
    console.log("  ✔ Unit tests passed cleanly!");
  } catch (err) {
    console.error("  ✖ Test failure detected during verification:", err.message);
    process.exit(1);
  }
}

console.log("\n[SUCCESS] Upstream sync workflow completed successfully.");
