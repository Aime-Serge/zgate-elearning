import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { company } from "@/lib/content";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Contact",
  description: `Get in touch with ${company.legalName}.`,
};

export default function ContactPage() {
  return (
    <>
      <header className={`max ${styles.header}`}>
        <h1 className={styles.title}>Start a conversation</h1>
        <p className={styles.lede}>
          Tell us what you need — a real person will follow up, not an automated response.
        </p>
      </header>

      <section className={`max ${styles.section}`}>
        <ContactForm />

        <div className={styles.directBlock}>
          <h2 className={styles.directHeading}>Prefer to talk directly?</h2>
          <p className={styles.directItem}>
            WhatsApp / Phone:{" "}
            <a href={`tel:${company.phone.replace(/\s/g, "")}`}>{company.phone}</a>
          </p>
          <p className={styles.directItem}>
            Email: <a href={`mailto:${company.email}`}>{company.email}</a>
          </p>
          <p className={styles.directItem}>{company.registeredAddress}</p>
        </div>
      </section>
    </>
  );
}
