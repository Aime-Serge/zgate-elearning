/**
 * The worker's job registry. Empty on purpose: this package is the
 * skeleton the planned jobs (README.md) will be added to, one module each,
 * when the feature that needs them is built.
 */
export interface Job {
  /** Stable identifier, used in logs and /health. */
  name: string;
  /** Does one unit of work. Must be safe to run again after a crash. */
  run: () => Promise<void>;
}

export const jobs: Job[] = [];
