import type { Metadata } from "next";
import { EnrollmentForm } from "@/components/EnrollmentForm";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Enroll",
  description: "Enroll in a Z-GATE Academy course.",
  alternates: { canonical: "/academy/enroll" },
};

export default function AcademyEnrollPage() {
  return (
    <section className={`max ${styles.section}`}>
      <header className={styles.header}>
        <h1 className={styles.title}>Enroll in a course</h1>
        <p className={styles.lede}>
          Tell us who&rsquo;s joining and pick a cohort — a Trainer confirms your spot shortly
          after.
        </p>
      </header>
      <EnrollmentForm />
    </section>
  );
}
