"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import styles from "./PortalNav.module.css";

const links = [
  { href: "/portal", label: "Status" },
  { href: "/portal/deliverables", label: "Deliverables" },
];

export function PortalNav() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();

  async function handleLogout() {
    await apiFetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    queryClient.setQueryData(["session"], null);
    router.push("/login");
  }

  return (
    <nav aria-label="Client portal" className={styles.nav}>
      <ul className={styles.list}>
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className={styles.link}
              aria-current={pathname === link.href ? "page" : undefined}
              data-active={pathname === link.href}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className={styles.logout}
        onClick={() => {
          void handleLogout();
        }}
      >
        Log out
      </button>
    </nav>
  );
}
