"use client";

import { useState } from "react";
import Link from "next/link";
import { GateMark } from "./GateMark";
import { navLinks } from "@/lib/nav";
import styles from "./Header.module.css";

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className={styles.header}>
      <div className={`max ${styles.bar}`}>
        <Link href="/" className={styles.brand}>
          <GateMark size={28} />
          <span>Z-GATE</span>
        </Link>

        <nav aria-label="Primary">
          <ul className={styles.desktopNav}>
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <button
          type="button"
          className={styles.menuButton}
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => {
            setOpen((value) => !value);
          }}
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      {open ? (
        <nav aria-label="Primary, mobile" id="mobile-nav" className="max">
          <ul className={styles.mobileNav}>
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => {
                    setOpen(false);
                  }}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
