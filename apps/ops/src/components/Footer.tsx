import Link from "next/link";
import { GateMark } from "./GateMark";
import { company, boilerplate, divisions } from "@/lib/content";
import { navLinks } from "@/lib/nav";
import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`max ${styles.grid}`}>
        <div>
          <div className={styles.brand}>
            <GateMark size={24} />
            <span>Z-GATE</span>
          </div>
          <p className={styles.boilerplate}>{boilerplate}</p>
        </div>

        <div>
          <h2 className={styles.heading}>Divisions</h2>
          <ul className={styles.list}>
            {divisions.map((division) => (
              <li key={division.slug}>
                <Link href={`/${division.slug}`}>{division.name}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className={styles.heading}>Company</h2>
          <ul className={styles.list}>
            {navLinks
              .filter((link) => link.href === "/about" || link.href === "/contact")
              .map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
          </ul>
        </div>
      </div>

      <div className={`max ${styles.bottom}`}>
        <span className={styles.meta}>
          {company.legalName} · {company.registeredAddress}
        </span>
        <span className={styles.meta}>{company.email}</span>
      </div>
    </footer>
  );
}
