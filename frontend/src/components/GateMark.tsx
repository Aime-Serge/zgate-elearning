/**
 * The Gate Mark — reproduced exactly from the approved Brand Identity
 * Guide (zgate-brand-identity(1).html): a Z rebuilt as architecture,
 * lintel + base + a diagonal gradient "threshold beam". Usage rule from
 * the guide: never mirror, rotate, recolor the pillars, or reverse the
 * gradient direction.
 */
export function GateMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="gateGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--gate-1)" />
          <stop offset="100%" stopColor="var(--gate-2)" />
        </linearGradient>
      </defs>
      <rect fill="var(--paper)" x="14" y="14" width="72" height="11" rx="2" />
      <rect fill="var(--paper)" x="14" y="75" width="72" height="11" rx="2" />
      <line
        stroke="url(#gateGrad)"
        strokeWidth="9"
        strokeLinecap="round"
        fill="none"
        x1="22"
        y1="30"
        x2="78"
        y2="70"
      />
    </svg>
  );
}
