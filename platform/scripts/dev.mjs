#!/usr/bin/env node
/**
 * Starts ONE product's dev servers (docs/DEVELOPMENT_LOW_MEMORY.md):
 *
 *   pnpm dev:website      CMS :3004 + public site :3002
 *   pnpm dev:elearning    API :3000 + frontend :3003 + worker :3005
 *
 * There is deliberately no command that starts both products: on an 8 GB
 * machine, run one at a time. Each runs `pnpm --filter ... --parallel run
 * dev` with the pnpm that launched this script, so it works whether or not
 * pnpm is on PATH (e.g. `corepack pnpm dev:website`). Node built-ins only.
 */
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const PRODUCTS = {
  website: ["@zgate/website-backend", "@zgate/website-frontend"],
  elearning: ["@zgate/elearning-backend", "@zgate/elearning-frontend", "@zgate/elearning-worker"],
};

const packages = PRODUCTS[process.argv[2] ?? ""];
if (!packages) {
  console.error(`usage: dev.mjs <${Object.keys(PRODUCTS).join("|")}>`);
  process.exit(2);
}

const args = [...packages.flatMap((name) => ["--filter", name]), "--parallel", "run", "dev"];
const pnpm = process.env["npm_execpath"];
const [command, commandArgs] =
  pnpm && /\.c?js$/.test(pnpm) ? [process.execPath, [pnpm, ...args]] : ["pnpm", args];

const child = spawn(command, commandArgs, {
  cwd: fileURLToPath(new URL("../..", import.meta.url)),
  stdio: "inherit",
  shell: command === "pnpm" && process.platform === "win32",
});
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
child.on("exit", (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
