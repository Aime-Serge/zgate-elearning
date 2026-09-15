import styles from "./Skeleton.module.css";

/**
 * A loading placeholder matching the eventual content's shape, preferred
 * over a generic spinner for list/card content
 * (docs/design/COMPONENT_SPECIFICATION.md's Loading states).
 */
export function Skeleton({ className }: { className?: string }) {
  return <div className={`${styles.skeleton} ${className ?? ""}`} />;
}
