#!/usr/bin/env node
/**
 * Keeps vendor/ - the snapshot of the other product's contract packages
 * this repository is checked against - honest (README.md, "Contracts"):
 *
 *   node scripts/sync-contracts.mjs --from <path to the other repository>
 *     Replaces each package in vendor/ with the other repository's
 *     committed version and records where it came from in
 *     vendor/VENDORED.json. Then run `pnpm install` and the contract tests.
 *
 *   node scripts/sync-contracts.mjs --check
 *     Fails if vendor/ differs from what VENDORED.json recorded, so the
 *     snapshot can only change through --from (CI runs this).
 *
 * Only what a consumer needs is copied: package.json (without scripts and
 * devDependencies), the non-test source files and the listed extra
 * folders. The checksum ignores line endings, so a Windows checkout
 * (core.autocrlf) and CI agree.
 *
 * Node built-ins only.
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const vendorDir = path.join(root, "vendor");
const manifestPath = path.join(vendorDir, "VENDORED.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

const TEST_FILE = /\.test\.[cm]?[jt]sx?$/;

function filesUnder(dir, base = dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const full = path.join(dir, entry.name);
      return entry.isDirectory() ? filesUnder(full, base) : [path.relative(base, full)];
    })
    .map((file) => file.split(path.sep).join("/"))
    .sort();
}

function checksum(dir) {
  const hash = createHash("sha256");
  for (const file of filesUnder(dir)) {
    const text = readFileSync(path.join(dir, file), "utf8").replace(/\r\n/g, "\n");
    hash.update(`${file}\0${text}\0`);
  }
  return hash.digest("hex");
}

function git(cwd, ...args) {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  if (result.status !== 0)
    throw new Error(`git ${args.join(" ")} failed in ${cwd}: ${result.stderr}`);
  return result.stdout.trim();
}

function check() {
  let failed = false;
  for (const [name, entry] of Object.entries(manifest.packages)) {
    const actual = checksum(path.join(vendorDir, name));
    if (actual !== entry.sha256) {
      console.error(
        `vendor/${name} does not match VENDORED.json (expected ${entry.sha256}, found ${actual}).\n` +
          `  Don't edit vendor/ by hand: change the package in ${manifest.source} and run\n` +
          `  node scripts/sync-contracts.mjs --from <path to ${manifest.source}>`,
      );
      failed = true;
    } else {
      console.log(`vendor/${name}: matches ${manifest.source} ${entry.path} @ ${entry.commit}`);
    }
  }
  process.exit(failed ? 1 : 0);
}

function sync(from) {
  const source = path.resolve(from);
  for (const [name, entry] of Object.entries(manifest.packages)) {
    const pkgDir = path.join(source, entry.path);
    const pkg = JSON.parse(readFileSync(path.join(pkgDir, "package.json"), "utf8"));
    if (pkg.name !== entry.name) {
      throw new Error(`${pkgDir} is ${pkg.name}, expected ${entry.name}. Wrong --from?`);
    }
    // Only committed code is vendored, so the recorded commit is the truth.
    if (git(source, "status", "--porcelain", "--", entry.path)) {
      throw new Error(`${entry.path} has uncommitted changes in ${source}. Commit them first.`);
    }

    const target = path.join(vendorDir, name);
    rmSync(target, { recursive: true, force: true });
    mkdirSync(target, { recursive: true });
    const { scripts: _scripts, devDependencies: _devDependencies, ...consumerPkg } = pkg;
    writeFileSync(path.join(target, "package.json"), `${JSON.stringify(consumerPkg, null, 2)}\n`);
    for (const folder of ["src", ...(entry.extraFolders ?? [])]) {
      for (const file of filesUnder(path.join(pkgDir, folder))) {
        if (TEST_FILE.test(file)) continue;
        const dest = path.join(target, folder, file);
        mkdirSync(path.dirname(dest), { recursive: true });
        cpSync(path.join(pkgDir, folder, file), dest);
      }
    }

    entry.commit = git(source, "rev-parse", "HEAD");
    // The package folder's tree id survives history rewrites, unlike the
    // commit id: `git rev-parse <commit>:<path>` in the source repository.
    entry.tree = git(source, "rev-parse", `HEAD:./${entry.path}`);
    entry.sha256 = checksum(target);
    console.log(`vendor/${name}: ${entry.path} @ ${entry.commit}`);
  }
  manifest.syncedAt = new Date().toISOString().slice(0, 10);
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log("Now run `pnpm install`, then the contract tests.");
}

const [mode, value] = process.argv.slice(2);
if (mode === "--check") check();
else if (mode === "--from" && value) sync(value);
else {
  console.error(
    "Usage: node scripts/sync-contracts.mjs --check | --from <path to the other repository>",
  );
  process.exit(2);
}
