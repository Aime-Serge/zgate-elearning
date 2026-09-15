"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { manualLeadFormSchema, leadChannelOptions, type ManualLeadFormValues } from "@/lib/schema";
import { apiFetch, ApiError } from "@/lib/api";
import { Button } from "./Button";
import styles from "./AddLeadForm.module.css";

/**
 * Manual lead entry (FEAT-02.2) - for leads that came in over
 * WhatsApp/phone/in person rather than the public contact form, which
 * already creates its own "website" channel leads server-side.
 * staff_marketing only, matching the backend's requireRole check on
 * POST /api/leads (src/modules/crm/routes.ts).
 */
export function AddLeadForm() {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ManualLeadFormValues>({
    resolver: zodResolver(manualLeadFormSchema),
  });

  const mutation = useMutation({
    mutationFn: (values: ManualLeadFormValues) =>
      apiFetch<{ success: true }>("/api/leads", {
        method: "POST",
        body: JSON.stringify(values),
      }),
    onSuccess: async () => {
      setServerError(null);
      setJustAdded(true);
      reset();
      await queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (error: unknown) => {
      setJustAdded(false);
      setServerError(
        error instanceof ApiError
          ? error.message
          : "Couldn't reach the server. Check your connection and try again.",
      );
    },
  });

  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        setJustAdded(false);
        void handleSubmit((values) => mutation.mutate(values))(event);
      }}
      noValidate
    >
      <h2 className={styles.heading}>Add a lead</h2>

      {serverError ? (
        <div className={styles.formError} role="alert">
          {serverError}
        </div>
      ) : null}
      {justAdded ? (
        <div className={styles.formSuccess} role="status">
          Lead added.
        </div>
      ) : null}

      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="lead-name">
            Name
          </label>
          <input
            id="lead-name"
            className={styles.input}
            aria-invalid={errors.name ? "true" : "false"}
            {...register("name")}
          />
          {errors.name ? <span className={styles.errorText}>{errors.name.message}</span> : null}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="lead-contact">
            Contact
          </label>
          <input
            id="lead-contact"
            className={styles.input}
            aria-invalid={errors.contact ? "true" : "false"}
            {...register("contact")}
          />
          {errors.contact ? (
            <span className={styles.errorText}>{errors.contact.message}</span>
          ) : null}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="lead-channel">
            Channel
          </label>
          <select
            id="lead-channel"
            className={styles.input}
            aria-invalid={errors.channel ? "true" : "false"}
            defaultValue=""
            {...register("channel")}
          >
            <option value="" disabled>
              Choose one
            </option>
            {leadChannelOptions.map((channel) => (
              <option key={channel} value={channel}>
                {channel}
              </option>
            ))}
          </select>
          {errors.channel ? (
            <span className={styles.errorText}>{errors.channel.message}</span>
          ) : null}
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="lead-need">
          What do they need? (optional)
        </label>
        <textarea id="lead-need" className={styles.textarea} {...register("statedNeed")} />
      </div>

      <Button type="submit" loading={isSubmitting || mutation.isPending}>
        Add lead
      </Button>
    </form>
  );
}
