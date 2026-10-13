import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(__dirname, "..");

// Ensure cargo bin is in PATH on Windows so Tauri CLI can always find cargo
const cargoDir = path.join(process.env.USERPROFILE || "", ".cargo", "bin");
if (fs.existsSync(cargoDir) && !(process.env.PATH || "").includes(cargoDir)) {
  process.env.PATH = `${cargoDir};${process.env.PATH}`;
}

const args = process.argv.slice(2);
const tauriScript = path.resolve(__dirname, "..", "node_modules", "@tauri-apps", "cli", "tauri.js");

const child = spawn(process.execPath, [tauriScript, ...args], {
  cwd: pkgRoot,
  stdio: "inherit",
  shell: false,
  env: process.env,
});

child.on("error", (err) => {
  console.error(err);
  process.exit(1);
});

child.on("exit", (code) => {
  process.exit(code || 0);
});
