import type { Metadata } from "next";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { company, elevatorPitch, divisions } from "@/lib/content";
import styles from "./page.module.css";

// Static generation — this content changes rarely, so it's pre-rendered
// at build time (docs/frontend/ROUTE_MAP.md's rendering-choice rationale).
export const dynamic = "error";

// Title/description are intentionally omitted - the root layout's
// defaults (docs/marketing/SEO_AUDIT.md) already are the homepage's
// title/description. Only the self-referencing canonical is new here.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <>
      <section className={`max ${styles.hero}`}>
        <p className={styles.eyebrow}>{company.motto}</p>
        <h1 className={styles.headline}>
          One gate, four rooms — no translation lost between them.
        </h1>
        <p className={styles.lede}>{elevatorPitch}</p>
        <Button href="/contact">Start a conversation</Button>
      </section>

      <section className={`max ${styles.section}`}>
        <h2 className={styles.sectionHeading}>Four divisions, one relationship</h2>
        <div className={styles.divisionGrid}>
          {divisions.map((division) => (
            <Card
              key={division.slug}
              href={`/${division.slug}`}
              accentColorVar={division.colorVar}
              title={division.shortName}
            >
              {division.mission}
            </Card>
          ))}
        </div>
      </section>

      <section className={`max ${styles.section}`}>
        <h2 className={styles.sectionHeading}>How it works</h2>
        <p className={styles.howItWorks}>
          A client doesn&rsquo;t hire four vendors and manage the seams themselves. Advisory,
          Academy, Tech, and Data share context, so a recommendation made in one room is already
          understood in the other three — they come through one gate, and the four rooms on the
          other side already know why they&rsquo;re there.
        </p>
      </section>

      <section className={`max ${styles.section} ${styles.ctaSection}`}>
        <h2 className={styles.sectionHeading}>Ready to talk?</h2>
        <Button href="/contact">Start a conversation</Button>
      </section>
    </>
  );
}
