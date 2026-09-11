"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordFormSchema, type ForgotPasswordFormValues } from "@/lib/schema";
import { apiFetch, ApiError } from "@/lib/api";
import { Button } from "./Button";
import styles from "./ForgotPasswordForm.module.css";

/**
 * Password-reset request (docs/security/SECURITY_REQUIREMENTS.md V2) -
 * the backend's response is identical whether or not the email matched
 * an account, so this form shows the exact same success message either
 * way. There is nothing to distinguish here even in the UI copy.
 */
export function ForgotPasswordForm() {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordFormSchema),
  });

  async function onSubmit(values: ForgotPasswordFormValues) {
    setServerError(null);
    try {
      await apiFetch<{ success: true }>("/api/auth/password-reset/request", {
        method: "POST",
        body: JSON.stringify(values),
      });
      setSubmitted(true);
    } catch (error) {
      setServerError(
        error instanceof ApiError
          ? error.message
          : "Couldn't reach the server. Check your connection and try again.",
      );
    }
  }

  if (submitted) {
    return (
      <div className={styles.success} role="status">
        If that email matches an account, we&rsquo;ve sent a link to reset the password. It
        expires in 1 hour.
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

      <Button type="submit" loading={isSubmitting}>
        Send reset link
      </Button>
    </form>
  );
}
