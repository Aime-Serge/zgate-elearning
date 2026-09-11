"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordFormSchema, type ResetPasswordFormValues } from "@/lib/schema";
import { apiFetch, ApiError } from "@/lib/api";
import { Button } from "./Button";
import styles from "./ResetPasswordForm.module.css";

/**
 * Redeems the token from the emailed reset link
 * (docs/security/SECURITY_REQUIREMENTS.md V2 - single-use, time-
 * limited). The token itself is never shown or editable - it only ever
 * travels as the URL's query string, exactly as the email linked it.
 */
export function ResetPasswordForm() {
  const token = useSearchParams().get("token");
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordFormSchema),
  });

  async function onSubmit(values: ResetPasswordFormValues) {
    setServerError(null);
    try {
      await apiFetch<{ success: true }>("/api/auth/password-reset/confirm", {
        method: "POST",
        body: JSON.stringify({ token, newPassword: values.newPassword }),
      });
      setDone(true);
    } catch (error) {
      setServerError(
        error instanceof ApiError
          ? error.message
          : "Couldn't reach the server. Check your connection and try again.",
      );
    }
  }

  if (!token) {
    return (
      <div className={styles.formError} role="alert">
        This link is missing its reset token. Request a new one from the{" "}
        <Link href="/forgot-password">forgot password</Link> page.
      </div>
    );
  }

  if (done) {
    return (
      <div className={styles.success} role="status">
        Your password has been reset. <Link href="/login">Log in</Link> with your new password.
      </div>
    );
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
        <label className={styles.label} htmlFor="newPassword">
          New password
        </label>
        <input
          id="newPassword"
          type="password"
          autoComplete="new-password"
          className={styles.input}
          aria-invalid={errors.newPassword ? "true" : "false"}
          aria-describedby={errors.newPassword ? "newPassword-error" : undefined}
          {...register("newPassword")}
        />
        {errors.newPassword ? (
          <span id="newPassword-error" className={styles.errorText}>
            {errors.newPassword.message}
          </span>
        ) : null}
      </div>

      <Button type="submit" loading={isSubmitting}>
        Reset password
      </Button>
    </form>
  );
}
