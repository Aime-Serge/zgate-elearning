/**
 * Toolchain-proving placeholder only. Real modules (identity, clients,
 * advisory, etc. — see docs/architecture/MODULE_ARCHITECTURE.md) land in
 * the dedicated backend architecture phase, not here.
 */
export interface HealthStatus {
  status: "ok";
  checkedAt: string;
}

export function getHealthStatus(now: Date = new Date()): HealthStatus {
  return {
    status: "ok",
    checkedAt: now.toISOString(),
  };
}
