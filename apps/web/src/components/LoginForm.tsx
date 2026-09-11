"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { loginFormSchema, type LoginFormValues } from "@/lib/schema";
import { apiFetch, ApiError } from "@/lib/api";
import type { SessionInfo } from "@/lib/useSession";
import { Button } from "./Button";
import styles from "./LoginForm.module.css";

/**
 * The one real login surface on the platform (FEAT-04.1). Same
 * loading/error/aria pattern as ContactForm.tsx - the backend never
 * distinguishes wrong-email from wrong-password
 * (docs/security/SECURITY_REQUIREMENTS.md V2), so this form doesn't
 * either: one generic error message either way.
 */
export function LoginForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
  });

  async function onSubmit(values: LoginFormValues) {
    setServerError(null);
    try {
      const session = await apiFetch<SessionInfo>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(values),
      });
      queryClient.setQueryData(["session"], session);

      // Role-based landing is UX convenience only - the backend
      // re-checks every request regardless of where this redirect
      // sends the browser (docs/frontend/FRONTEND_SECURITY.md).
      if (session.role === "staff_marketing" || session.role === "staff_advisory") {
        router.push("/staff/leads");
      } else if (session.role === "client") {
        router.push("/portal");
      } else {
        router.push("/");
      }
    } catch (error) {
      if (error instanceof ApiError) {
        setServerError(error.message);
      } else {
        setServerError("Couldn't reach the server. Check your connection and try again.");
      }
    }
  }

  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        void handleSubmit(onSubmit)(event);
      }}
      noValidate
    >
      {serverError ? (
        <div className={styles.formError} role="alert">
          {serverError}
        </div>
      ) : null}

      <div className={styles.field}>
        <label className={styles.label} htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          className={styles.input}
          aria-invalid={errors.email ? "true" : "false"}
          aria-describedby={errors.email ? "email-error" : undefined}
          {...register("email")}
        />
        {errors.email ? (
          <span id="email-error" className={styles.errorText}>
            {errors.email.message}
          </span>
        ) : null}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          className={styles.input}
          aria-invalid={errors.password ? "true" : "false"}
          aria-describedby={errors.password ? "password-error" : undefined}
          {...register("password")}
        />
        {errors.password ? (
          <span id="password-error" className={styles.errorText}>
            {errors.password.message}
          </span>
        ) : null}
      </div>

      <Button type="submit" loading={isSubmitting}>
        Log in
      </Button>

      <Link href="/forgot-password" className={styles.forgotLink}>
        Forgot your password?
      </Link>
    </form>
  );
}
