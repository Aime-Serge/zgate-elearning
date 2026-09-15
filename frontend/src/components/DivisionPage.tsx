import { Button } from "./Button";
import type { Division } from "@/lib/content";
import { academyCourses } from "@/lib/content";
import styles from "./DivisionPage.module.css";

/**
 * One template, four pages (Advisory/Academy/Tech/Data) — same
 * structural template, content differs, per docs/design/
 * PAGE_SPECIFICATIONS.md. Building four separately-coded pages would be
 * exactly the duplication docs/frontend/COMPONENT_ARCHITECTURE.md warns
 * against.
 */
export function DivisionPage({ division }: { division: Division }) {
  return (
    <>
      <header className={`max ${styles.header}`}>
        <p className={styles.eyebrow} style={{ color: division.colorVar }}>
          {division.shortName}
        </p>
        <h1 className={styles.title}>{division.mission}</h1>
        <p className={styles.mission}>{division.about}</p>
      </header>

      <section className={`max ${styles.section}`}>
        <h2 className={styles.sectionHeading}>What&rsquo;s included</h2>
        <ul className={styles.includedList}>
          {division.included.map((item) => (
            <li key={item}>
              <span
                aria-hidden="true"
                className={styles.dot}
                style={{ background: division.colorVar }}
              />
              {item}
            </li>
          ))}
        </ul>
      </section>

      {division.slug === "academy" ? (
        <section className={`max ${styles.section}`}>
          <h2 className={styles.sectionHeading}>Current courses</h2>
          <ul className={styles.includedList}>
            {academyCourses.map((course) => (
              <li key={course.name}>
                <strong>{course.name}</strong> — {course.duration}, {course.fee}. For{" "}
                {course.audience.toLowerCase()}
              </li>
            ))}
          </ul>
          <div className={styles.enrollCta}>
            <Button href="/academy/enroll">Enroll now</Button>
          </div>
        </section>
      ) : null}

      <section className={`max ${styles.section}`}>
        <h2 className={styles.sectionHeading}>What we can show you now</h2>
        <p className={styles.mission}>{division.proof}</p>
      </section>

      <section className={`max ${styles.section}`}>
        <h2 className={styles.sectionHeading}>{division.objection.question}</h2>
        <p className={styles.mission}>{division.objection.answer}</p>
      </section>

      <section className={`max ${styles.section}`}>
        <Button href="/contact">Start a conversation</Button>
      </section>
    </>
  );
}
