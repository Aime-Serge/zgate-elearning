import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";
import styles from "../login/page.module.css";

export const metadata: Metadata = {
  title: "Set a new password",
};

export default function ResetPasswordPage() {
  return (
    <section className={`max ${styles.section}`}>
      <header className={styles.header}>
        <h1 className={styles.title}>Set a new password</h1>
      </header>
      <Suspense fallback={<p>Loading…</p>}>
        <ResetPasswordForm />
      </Suspense>
    </section>
  );
}
