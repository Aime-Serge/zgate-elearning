"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import styles from "./StaffNav.module.css";

const ALL_LINKS = [
  { href: "/staff/leads", label: "Leads", roles: ["staff_marketing", "admin"] },
  { href: "/staff/clients", label: "Clients", roles: ["staff_advisory", "admin"] },
  {
    href: "/staff/reporting",
    label: "Reporting",
    roles: ["staff_marketing", "staff_advisory", "admin"],
  },
];

/**
 * Sidebar navigation, scoped per role
 * (docs/design/COMPONENT_SPECIFICATION.md: "a user never sees a nav
 * item for a division/module their role doesn't cover") - a UX
 * convenience only, every link's destination re-checks role/ownership
 * server-side regardless (docs/frontend/FRONTEND_SECURITY.md).
 */
export function StaffNav({ role }: { role: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const links = ALL_LINKS.filter((link) => link.roles.includes(role));

  async function handleLogout() {
    await apiFetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    queryClient.setQueryData(["session"], null);
    router.push("/login");
  }

  return (
    <nav aria-label="Staff portal" className={styles.nav}>
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
