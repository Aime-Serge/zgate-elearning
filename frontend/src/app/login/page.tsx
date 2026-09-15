import type { Metadata } from "next";
import { LoginForm } from "@/components/LoginForm";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Log in",
};

export default function LoginPage() {
  return (
    <section className={`max ${styles.section}`}>
      <header className={styles.header}>
        <h1 className={styles.title}>Log in</h1>
        <p className={styles.lede}>For Z-GATE staff and clients.</p>
      </header>
      <LoginForm />
    </section>
  );
}
