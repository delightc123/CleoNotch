// Copies the packages Tauri buries in target/release/bundle/ into
// windows/release/, with the names they ship under. Used by `npm run pack` and
// by the release workflows, so both produce exactly the same file names.

import { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const bundleRoot = join(root, "target", "release", "bundle");
const outDir = join(root, "release");

const { version } = JSON.parse(readFileSync(join(root, "src-tauri", "tauri.conf.json"), "utf8"));

// What each platform ships: where Tauri puts it, how to recognise it, and the
// names it is published under (the rolling name, when there is one, always
// points at the latest release).
const arch = process.arch === "arm64" ? "aarch64" : "x86_64";
const debArch = process.arch === "arm64" ? "arm64" : "amd64";
const isCI = Boolean(process.env.GITHUB_ACTIONS);
const PACKAGES = {
  win32: [
    {
      dir: "nsis",
      suffix: "-setup.exe",
      names: isCI ? [`HeyCleo-${version}-setup.exe`, "HeyCleo-setup.exe"] : ["HeyCleo-setup.exe"],
    },
    {
      dir: "msi",
      suffix: ".msi",
      names: isCI ? [`HeyCleo-${version}.msi`, "HeyCleo.msi"] : ["HeyCleo.msi"],
    },
  ],
  linux: [
    {
      dir: "appimage",
      suffix: ".AppImage",
      names: [`HeyCleo-${version}-${arch}.AppImage`, `HeyCleo-${arch}.AppImage`],
    },
    { dir: "deb", suffix: ".deb", names: [`HeyCleo-${version}-${debArch}.deb`] },
    { dir: "rpm", suffix: ".rpm", names: [`HeyCleo-${version}-${arch}.rpm`] },
  ],
};

const packages = PACKAGES[process.platform];

/** The newest file in `dir` ending with `suffix`, in case an older build is still lying around. */
function newest(dir, suffix) {
  let files = [];
  try {
    files = readdirSync(dir).filter((f) => f.endsWith(suffix));
  } catch {
    return null;
  }
  if (files.length === 0) return null;
  return files
    .map((f) => join(dir, f))
    .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)[0];
}

/**
 * Extracts release notes for `version` from a Markdown changelog string.
 * Searches for a `## ` section header matching `version` first, falling back
 * to the first `## ` section if none matches, handling `\r?\n` line endings cleanly.
 */
export function extractReleaseNotes(changelogText, version) {
  const fallback = `HeyCleo v${version} release update`;
  if (typeof changelogText !== "string" || !changelogText.trim()) {
    return fallback;
  }
  const normalized = changelogText.replace(/\r\n/g, "\n");
  const sections = [...normalized.matchAll(/(?:^|\n)##\s+([^\n]+)\n+([\s\S]*?)(?=\n##\s+|$)/g)];
  if (sections.length === 0) {
    return fallback;
  }
  const escapedVersion = String(version).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const versionRegex = new RegExp(`(?:^|\\D)${escapedVersion}(?:$|\\D)`);
  const matched = sections.find((m) => versionRegex.test(m[1])) || sections[0];
  const body = matched?.[2]?.trim();
  return body || fallback;
}

const isMain =
  Boolean(process.argv[1]) &&
  resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));

if (isMain) {
  if (!packages) {
    console.error(`Nothing to pack on ${process.platform}.`);
    process.exit(1);
  }

  mkdirSync(outDir, { recursive: true });
  const written = [];

  // On Windows, always package the standalone portable HeyCleo.exe directly from target/release
  if (process.platform === "win32") {
    const exePath = join(root, "target", "release", "cleonotch.exe");
    const heycleoExePath = join(root, "target", "release", "HeyCleo.exe");
    const srcExe = statSync(heycleoExePath, { throwIfNoEntry: false }) ? heycleoExePath : (statSync(exePath, { throwIfNoEntry: false }) ? exePath : null);
    if (srcExe) {
      // Ensure target/release/HeyCleo.exe exists so users navigating to target/release see HeyCleo.exe
      if (srcExe !== heycleoExePath) {
        try {
          copyFileSync(srcExe, heycleoExePath);
          written.push(heycleoExePath);
        } catch (err) {
          if (err.code === "EBUSY") {
            throw new Error(
              `Cannot overwrite ${heycleoExePath} because HeyCleo.exe is currently running. Close HeyCleo before packing.`
            );
          }
          throw err;
        }
      }
      const exeNames = isCI ? [`HeyCleo-${version}.exe`, "HeyCleo.exe"] : ["HeyCleo.exe"];
      for (const name of exeNames) {
        const dest = join(outDir, name);
        try {
          copyFileSync(srcExe, dest);
          written.push(dest);
        } catch (err) {
          if (err.code === "EBUSY") {
            throw new Error(
              `Cannot overwrite ${dest} because HeyCleo.exe is currently running. Close HeyCleo before packing.`
            );
          } else {
            throw err;
          }
        }
      }
      const hookPath = join(root, "target", "release", "cleo-hook.exe");
      if (statSync(hookPath, { throwIfNoEntry: false })) {
        const destHook = join(outDir, "cleo-hook.exe");
        try {
          copyFileSync(hookPath, destHook);
          written.push(destHook);
        } catch (err) {
          if (err.code === "EBUSY") {
            throw new Error(
              `Cannot overwrite ${destHook} because HeyCleo.exe is currently running. Close HeyCleo before packing.`
            );
          }
          throw err;
        }
      }
    }
  }

  for (const { dir, suffix, names } of packages) {
    const built = newest(join(bundleRoot, dir), suffix);
    if (built) {
      for (const name of names) {
        const dest = join(outDir, name);
        try {
          copyFileSync(built, dest);
          written.push(dest);
        } catch (err) {
          if (err.code === "EBUSY") {
            throw new Error(
              `Cannot overwrite ${dest} because HeyCleo.exe is currently running. Close HeyCleo before packing.`
            );
          } else {
            throw err;
          }
        }
      }
    }
  }

  // Copy signature files and generate latest.json for Tauri updater
  if (process.platform === "win32") {
    const nsisDir = join(bundleRoot, "nsis");
    const nsisSetup = newest(nsisDir, "-setup.exe");
    if (nsisSetup) {
      const sigPath = nsisSetup + ".sig";
      if (statSync(sigPath, { throwIfNoEntry: false })) {
        const sigContent = readFileSync(sigPath, "utf8").trim();
        for (const name of [`HeyCleo-${version}-setup.exe.sig`, "HeyCleo-setup.exe.sig"]) {
          const dest = join(outDir, name);
          copyFileSync(sigPath, dest);
          written.push(dest);
        }
        // Resolve dynamic release notes from environment variable or version-matched CHANGELOG.md entry
        let notes = process.env.RELEASE_NOTES?.trim() || "";
        if (!notes) {
          try {
            const changelogPath = join(root, "..", "..", "CHANGELOG.md");
            if (statSync(changelogPath, { throwIfNoEntry: false })) {
              const changelogText = readFileSync(changelogPath, "utf8");
              notes = extractReleaseNotes(changelogText, version);
            }
          } catch (err) {
            console.warn("[pack] changelog parse skipped:", err.message);
          }
        }
        if (!notes) {
          notes = `HeyCleo v${version} release update`;
        }

        const manifest = {
          version,
          notes,
          pub_date: new Date().toISOString(),
          platforms: {
            "windows-x86_64": {
              signature: sigContent,
              url: `https://github.com/delightc123/CleoNotch/releases/download/windows-v${version}/HeyCleo-${version}-setup.exe`
            }
          }
        };
        const manifestPath = join(outDir, "latest.json");
        writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");
        written.push(manifestPath);
      }
    }
  }

  if (written.length === 0) {
    console.error("No built binaries found to pack. Run `pnpm tauri build` first.");
    process.exit(1);
  }

  console.log("\n  Packages ready in " + outDir + ":\n");
  for (const f of written) {
    const mb = (statSync(f).size / 1024 / 1024).toFixed(2);
    console.log(`  ${f}  (${mb} MB)`);
  }
  console.log();
}
