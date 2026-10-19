# Developing on a low-memory machine (8 GB Windows)

This repository is set up to run comfortably on an 8 GB laptop. Two habits matter most: **hybrid mode** (only Postgres runs in Docker; apps run natively), and **one product at a time** if you also work on the website repository. Everything below is optional advice. Nothing in this repository changes your system settings for you.

## 1. Move the repository out of OneDrive

OneDrive syncs every file a build writes (`node_modules`, `.next`, caches): tens of thousands of small files. That costs CPU and memory and can lock files mid-build. Clone or move the repositories to a local folder, for example:

```powershell
git clone <website-repo-url>   C:\dev\z-gate\website
git clone <elearning-repo-url> C:\dev\z-gate\elearning
```

Keep `C:\dev` outside any synced folder.

## 2. Exclude the project folder from Microsoft Defender (folder only)

Real-time scanning of every file Node reads slows installs and builds noticeably. If your organisation allows it, add an exclusion for the project folder only, never a whole drive or a process:

Windows Security > Virus & threat protection > Manage settings > Exclusions > Add an exclusion > Folder > `C:\dev\z-gate` (the folder holding both repositories)

Ask IT first on a managed machine.

## 3. Limit Docker's (WSL 2) memory

Docker Desktop's WSL 2 VM otherwise grows to take most of the RAM. Create `%UserProfile%\.wslconfig`:

```ini
[wsl2]
memory=2560MB
processors=2
swap=2GB
```

Then run `wsl --shutdown` and restart Docker Desktop. 2.5 GB is enough for one Postgres (capped at 256 MB) plus headroom; raise it only if you use `--profile full`.

## 4. Hybrid mode, one product at a time

```bash
docker compose -f deploy/compose.yml up -d                # Postgres only (localhost:5433)
pnpm dev                                                  # API :3000, frontend :3003, worker :3005
```

- Before switching to the website repository, stop this one (`Ctrl+C` in its terminal, then `docker compose -f deploy/compose.yml stop`). The two products use different Postgres ports (5433 here, 5432 there), so running both is possible on a larger machine, never needed.
- `--profile full` runs the apps in containers too, with memory caps (Postgres 256m, Node services 512m, Next.js apps 1g); `--profile legacy` adds the frozen ops portal. It's heavier than hybrid mode; use it only when you need container parity.
- First run: copy the env template and migrate (`docs/DEVELOPER_GUIDE.md`, "Get running").

### What the repository already does for you

| Setting | Where | Effect |
| --- | --- | --- |
| Node heap ceiling 1.5 GB | `.npmrc` (`node-options`) | Every `pnpm run` script's heap stops at about 1.7 GB instead of about 2.2 GB. `npm_config_node_options=...` in the environment overrides it. Not used in Docker image builds or CI. |
| Two test workers | every package's `vitest.config.ts` | `maxWorkers: 2` locally; CI keeps Vitest's default |
| One package at a time | the workspace's `lint` / `typecheck` / `test` / `build` scripts | `pnpm -r --workspace-concurrency=1 run <task>`; there is no Turborepo, and the other product is another repository, so its tools never load here |
| ESLint cache | `lint` scripts (`--cache`) | A repeat lint only re-checks changed files |
| Incremental type checking | `typecheck` scripts / Next.js tsconfigs | A repeat typecheck re-uses the last run |
| Editor | `.vscode/settings.json` | VS Code skips `node_modules`, `.next`, `dist`, `.turbo` and `coverage` when watching and searching; the TypeScript server is capped at 2 GB |

Inside each workspace (the repository root, and `legacy/ops/`), the workspace scripts already run one package at a time:

```bash
pnpm lint      # = pnpm -r --workspace-concurrency=1 run lint; likewise typecheck, test, build
```

## 5. Check where the memory goes

- **Task Manager** (Ctrl+Shift+Esc) > Processes: sort by Memory. Expect a few `node.exe` processes per running app and one `Vmmem` / `VmmemWSL` for Docker.
- **`docker stats`**: live memory per container against its cap, e.g. `elearning-postgres ... / 256MiB`.
- If memory stays high after you stop a product, look for leftover `node.exe` processes in Task Manager (see the known issues below).

## Known issues

- **Stopping a dev command from a tool or IDE may leave child processes running** on Windows. `Ctrl+C` in the terminal stops them all; otherwise end the leftover `node.exe` processes in Task Manager, or free a port with `netstat -ano | findstr :3002` and `taskkill /PID <pid> /T /F`.
- **`pnpm db:migrate` and some package scripts call `pnpm` by name.** Run `corepack enable` once so `pnpm` is on your PATH (it modifies your Node installation, so it's your call). `pnpm dev` and `pnpm db:migrate` work without it.
