import type { ReactNode } from "react";
import { StaffNav } from "./StaffNav";
import styles from "./StaffPortalLayout.module.css";

export function StaffPortalLayout({ role, children }: { role: string; children: ReactNode }) {
  return (
    <div className={`max ${styles.layout}`}>
      <StaffNav role={role} />
      <div className={styles.content}>{children}</div>
    </div>
  );
}
