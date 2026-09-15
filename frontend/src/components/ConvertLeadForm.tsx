"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { convertLeadFormSchema, type ConvertLeadFormValues } from "@/lib/schema";
import { apiFetch, ApiError } from "@/lib/api";
import { Button } from "./Button";
import styles from "./ConvertLeadForm.module.css";

/**
 * Lead → Client conversion (FEAT-03.2). Only the legal-name field is
 * required, matching src/modules/crm/schema.ts's convertLeadInputSchema
 * exactly - the Client SLA itself stays a human/legal step outside this
 * form (docs/product/PRD.md non-goals), this only creates the Client
 * record and closes the lead.
 */
export function ConvertLeadForm({ leadId, onDone }: { leadId: string; onDone: () => void }) {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ConvertLeadFormValues>({
    resolver: zodResolver(convertLeadFormSchema),
  });

  const mutation = useMutation({
    mutationFn: (values: ConvertLeadFormValues) =>
      apiFetch<{ clientId: string; leadId: string }>(`/api/leads/${leadId}/convert`, {
        method: "POST",
        body: JSON.stringify(values),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["leads"] });
      onDone();
    },
    onError: (error: unknown) => {
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
        void handleSubmit((values) => mutation.mutate(values))(event);
      }}
      noValidate
    >
      {serverError ? (
        <div className={styles.formError} role="alert">
          {serverError}
        </div>
      ) : null}

      <div className={styles.field}>
        <label className={styles.label} htmlFor={`convert-legal-name-${leadId}`}>
          Client legal name
        </label>
        <input
          id={`convert-legal-name-${leadId}`}
          className={styles.input}
          aria-invalid={errors.legalName ? "true" : "false"}
          {...register("legalName")}
        />
        {errors.legalName ? (
          <span className={styles.errorText}>{errors.legalName.message}</span>
        ) : null}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor={`convert-tin-${leadId}`}>
          TIN (optional)
        </label>
        <input id={`convert-tin-${leadId}`} className={styles.input} {...register("tin")} />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor={`convert-address-${leadId}`}>
          Registered address (optional)
        </label>
        <input
          id={`convert-address-${leadId}`}
          className={styles.input}
          {...register("registeredAddress")}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor={`convert-contact-name-${leadId}`}>
          Primary contact name (optional)
        </label>
        <input
          id={`convert-contact-name-${leadId}`}
          className={styles.input}
          {...register("primaryContactName")}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor={`convert-contact-channel-${leadId}`}>
          Primary contact channel (optional)
        </label>
        <input
          id={`convert-contact-channel-${leadId}`}
          className={styles.input}
          {...register("primaryContactChannel")}
        />
      </div>

      <div className={styles.actions}>
        <Button type="submit" loading={isSubmitting || mutation.isPending}>
          Convert to client
        </Button>
        <Button type="button" variant="secondary" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
