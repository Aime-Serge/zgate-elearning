import type { ReactNode } from "react";
import styles from "./Alert.module.css";

type Variant = "info" | "success" | "warning" | "error";

/**
 * Page/section-level message - a failed data load, an empty state, a
 * compliance deadline. Never color-only: message text always states the
 * nature of the alert (docs/design/COMPONENT_SPECIFICATION.md).
 */
export function Alert({
  variant,
  children,
  urgent = false,
}: {
  variant: Variant;
  children: ReactNode;
  /** Error-class alerts default to role="alert" (interrupts); anything
   * else defaults to role="status" (polite) - urgent overrides either
   * way when a specific alert needs the assertive announcement. */
  urgent?: boolean;
}) {
  const role = urgent || variant === "error" ? "alert" : "status";
  return (
    <div className={`${styles.alert} ${styles[variant]}`} role={role}>
      {children}
    </div>
  );
}
