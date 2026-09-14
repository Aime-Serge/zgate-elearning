import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./Card.module.css";

export function Card({
  href,
  accentColorVar,
  title,
  children,
}: {
  href: string;
  accentColorVar: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={styles.card} style={{ borderLeftColor: accentColorVar }}>
      <span className={styles.dot} style={{ background: accentColorVar }} />
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.body}>{children}</p>
    </Link>
  );
}
