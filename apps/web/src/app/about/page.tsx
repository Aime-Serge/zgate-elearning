import type { Metadata } from "next";
import { aboutLongForm, mission, vision, values, company } from "@/lib/content";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "About",
  description: mission,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <header className={`max ${styles.header}`}>
        <h1 className={styles.title}>About {company.legalName}</h1>
      </header>

      <section className={`max ${styles.section}`}>
        <div className={styles.prose}>
          {aboutLongForm.map((paragraph) => (
            <p key={paragraph.slice(0, 24)}>{paragraph}</p>
          ))}
        </div>
      </section>

      <section className={`max ${styles.section}`}>
        <h2 className={styles.sectionHeading}>Mission</h2>
        <p className={styles.prose}>{mission}</p>
      </section>

      <section className={`max ${styles.section}`}>
        <h2 className={styles.sectionHeading}>Vision</h2>
        <p className={styles.prose}>{vision}</p>
      </section>

      <section className={`max ${styles.section}`}>
        <h2 className={styles.sectionHeading}>Values</h2>
        <div className={styles.valuesGrid}>
          {values.map((value) => (
            <div key={value.name}>
              <h3 className={styles.valueName}>{value.name}</h3>
              <p className={styles.valueBody}>{value.body}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
