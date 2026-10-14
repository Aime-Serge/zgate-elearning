"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import styles from "./Modal.module.css";

/**
 * Used sparingly, for one documented case at MVP (FEAT-06.2: confirming
 * a compliance-critical "mark complete" action) - a confirmation modal
 * is what "hard to trigger accidentally" means here
 * (docs/ux/EXPERIENCE_REQUIREMENTS.md §4), not a general-purpose overlay
 * used decoratively elsewhere (docs/design/COMPONENT_SPECIFICATION.md).
 *
 * Built on the native <dialog> element: showModal() traps focus and
 * Escape-to-close automatically, per spec, rather than reimplementing
 * either by hand.
 */
export function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby={titleId}
      onClose={onClose}
      onCancel={onClose}
    >
      <h2 id={titleId} className={styles.title}>
        {title}
      </h2>
      <div className={styles.body}>{children}</div>
    </dialog>
  );
}
