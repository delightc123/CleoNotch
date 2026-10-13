import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(__dirname, "..");

// Ensure cargo bin directory is in PATH on Windows
const cargoDir = path.join(process.env.USERPROFILE || "", ".cargo", "bin");
if (fs.existsSync(cargoDir) && !(process.env.PATH || "").includes(cargoDir)) {
  process.env.PATH = `${cargoDir};${process.env.PATH}`;
}

let hasCargo = false;
try {
  execSync("cargo --version", { stdio: "ignore", env: process.env });
  hasCargo = true;
} catch {
  console.log("[Cleo] Cargo not currently available; skipping cleo-hook binary build.");
}

if (hasCargo) {
  try {
    console.log("[Cleo] Cargo detected. Building cleo-hook binary...");
    execSync("cargo build --release -p cleo-hook", {
      cwd: pkgRoot,
      stdio: "inherit",
      env: process.env,
    });

    // Ensure both cleo-hook and coucou-hook exist in target/release
    const relDir = path.resolve(__dirname, "..", "target", "release");
    const ext = process.platform === "win32" ? ".exe" : "";
    const cleoBin = path.join(relDir, `cleo-hook${ext}`);
    const coucouBin = path.join(relDir, `coucou-hook${ext}`);
    if (fs.existsSync(cleoBin) && !fs.existsSync(coucouBin)) {
      fs.copyFileSync(cleoBin, coucouBin);
      console.log(`[Cleo] Created backward-compatible coucou-hook${ext} alias`);
    }
  } catch (err) {
    console.error("[Cleo] Failed to build cleo-hook binary:", err.message);
    process.exit(1);
  }
}
