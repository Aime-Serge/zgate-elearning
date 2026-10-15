import type { Job } from "./jobs.js";

export interface RunnerOptions {
  intervalMs: number;
  log: (message: string) => void;
}

/**
 * Runs every registered job once per interval, never overlapping itself,
 * and keeps going when one job fails. Returns a stop function that waits
 * for an in-flight round to finish.
 */
export function startRunner(jobs: readonly Job[], { intervalMs, log }: RunnerOptions) {
  let round: Promise<void> | null = null;

  const tick = () => {
    if (round) return;
    round = (async () => {
      for (const job of jobs) {
        try {
          await job.run();
        } catch (error) {
          log(`job ${job.name} failed: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    })().finally(() => {
      round = null;
    });
  };

  const timer = setInterval(tick, intervalMs);
  return async () => {
    clearInterval(timer);
    await round;
  };
}
