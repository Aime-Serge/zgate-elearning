"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { enrollmentFormSchema, type EnrollmentFormValues } from "@/lib/schema";
import { apiFetch, ApiError } from "@/lib/api";
import type { Cohort } from "@/lib/academy";
import { Button } from "./Button";
import styles from "./EnrollmentForm.module.css";

/**
 * FEAT-08.2's "short enrollment form" - name, contact, and which open
 * cohort. No account creation required (docs/database/DATA_MODEL.md:
 * learners are Trainer-managed, not identity-module accounts).
 */
export function EnrollmentForm() {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const cohortsQuery = useQuery<{ cohorts: Cohort[] }>({
    queryKey: ["public-cohorts"],
    queryFn: () => apiFetch("/api/academy/cohorts"),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EnrollmentFormValues>({
    resolver: zodResolver(enrollmentFormSchema),
  });

  async function onSubmit(values: EnrollmentFormValues) {
    setServerError(null);
    try {
      await apiFetch("/api/academy/enrollments", {
        method: "POST",
        body: JSON.stringify(values),
      });
      setSubmitted(true);
      reset();
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
        You&rsquo;re enrolled — a Trainer will confirm your spot shortly.
      </div>
    );
  }

  const cohorts = cohortsQuery.data?.cohorts ?? [];

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
        <label className={styles.label} htmlFor="enroll-name">
          Name
        </label>
        <input
          id="enroll-name"
          className={styles.input}
          aria-invalid={errors.name ? "true" : "false"}
          {...register("name")}
        />
        {errors.name ? <span className={styles.errorText}>{errors.name.message}</span> : null}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="enroll-contact">
          Phone or email
        </label>
        <input
          id="enroll-contact"
          className={styles.input}
          aria-invalid={errors.contact ? "true" : "false"}
          {...register("contact")}
        />
        {errors.contact ? <span className={styles.errorText}>{errors.contact.message}</span> : null}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="enroll-cohort">
          Cohort
        </label>
        <select
          id="enroll-cohort"
          className={styles.input}
          aria-invalid={errors.cohortId ? "true" : "false"}
          defaultValue=""
          disabled={cohortsQuery.isLoading || cohorts.length === 0}
          {...register("cohortId")}
        >
          <option value="" disabled>
            {cohortsQuery.isLoading ? "Loading cohorts…" : "Choose a cohort"}
          </option>
          {cohorts.map((cohort) => (
            <option key={cohort.id} value={cohort.id}>
              {cohort.courseName} — {cohort.label}
            </option>
          ))}
        </select>
        {errors.cohortId ? (
          <span className={styles.errorText}>{errors.cohortId.message}</span>
        ) : null}
        {!cohortsQuery.isLoading && cohorts.length === 0 ? (
          <span className={styles.errorText}>No open cohorts right now — check back soon.</span>
        ) : null}
      </div>

      <Button type="submit" loading={isSubmitting}>
        Enroll
      </Button>
    </form>
  );
}
