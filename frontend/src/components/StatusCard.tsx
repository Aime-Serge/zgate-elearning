import styles from "./StatusCard.module.css";

type Tone = "success" | "warning";

/**
 * The single most important card in the entire MVP
 * (docs/design/COMPONENT_SPECIFICATION.md) - a client's current
 * compliance status in one plain sentence, plus the next due item and
 * date. Status is never color-only: the sentence itself always states
 * the status in words.
 */
export function StatusCard({
  tone,
  sentence,
  nextItemLabel,
  nextDueDate,
}: {
  tone: Tone;
  sentence: string;
  nextItemLabel: string;
  nextDueDate: string;
}) {
  return (
    <div className={`${styles.card} ${styles[tone]}`} role="status">
      <p className={styles.sentence}>{sentence}</p>
      <div className={styles.nextUp}>
        <span className={styles.nextLabel}>{nextItemLabel}</span>
        <span className={styles.nextDate}>{nextDueDate}</span>
      </div>
    </div>
  );
}
