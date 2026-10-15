/**
 * Entry point: the health endpoint plus the job runner. No database
 * connection yet - the first real job brings one (as the e-learning app
 * role, elearning/database/init/01-roles.sql).
 */
import { createHealthServer } from "./health.js";
import { jobs } from "./jobs.js";
import { startRunner } from "./runner.js";

const port = Number(process.env["PORT"] ?? 3005);
const intervalMs = Number(process.env["WORKER_INTERVAL_MS"] ?? 30_000);
const log = (message: string) => console.log(`[worker] ${message}`);

const server = createHealthServer(jobs.map((job) => job.name));
server.listen(port, () => log(`health on :${port}, ${jobs.length} job(s) registered`));
const stopRunner = startRunner(jobs, { intervalMs, log });

const shutdown = (signal: string) => {
  log(`${signal}: stopping`);
  server.close();
  void stopRunner().then(() => process.exit(0));
};
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
