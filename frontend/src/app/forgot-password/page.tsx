import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";
import styles from "../login/page.module.css";

export const metadata: Metadata = {
  title: "Reset your password",
};

export default function ForgotPasswordPage() {
  return (
    <section className={`max ${styles.section}`}>
      <header className={styles.header}>
        <h1 className={styles.title}>Reset your password</h1>
        <p className={styles.lede}>
          Enter the email on your account and we&rsquo;ll send you a link to reset it.
        </p>
      </header>
      <ForgotPasswordForm />
    </section>
  );
}
