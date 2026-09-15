import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import styles from "./Button.module.css";

type Variant = "primary" | "secondary";

interface CommonProps {
  variant?: Variant;
  loading?: boolean;
  className?: string;
  children: ReactNode;
}

interface ButtonAsLink extends CommonProps {
  href: string;
}

interface ButtonAsButton
  extends CommonProps, Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> {
  href?: undefined;
}

type ButtonProps = ButtonAsLink | ButtonAsButton;

/**
 * One Button for every surface on this site — navigation CTAs (href)
 * and form submit actions (no href) share the same visual component,
 * per docs/frontend/COMPONENT_ARCHITECTURE.md's reuse rule.
 */
export function Button(props: ButtonProps) {
  const variant = props.variant ?? "primary";
  const className = `${styles.button} ${styles[variant]} ${props.className ?? ""}`;

  if ("href" in props && props.href !== undefined) {
    const { href, children } = props;
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  const { loading, variant: _variant, className: _className, children, ...rest } = props;
  return (
    <button className={className} disabled={loading ?? rest.disabled} {...rest}>
      {loading ? "…" : children}
    </button>
  );
}
