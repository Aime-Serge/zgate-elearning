"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactFormSchema, type ContactFormValues } from "@/lib/schema";
import { Button } from "./Button";
import styles from "./ContactForm.module.css";

type SubmitState = "idle" | "success" | "error";

const API_URL = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3000";

/**
 * The one genuinely interactive piece of the public site - real
 * loading/error/success states, wired to the actual backend endpoint
 * (POST /api/public/contact, implemented in the crm-module vertical
 * slice), not a mockup with no functionality behind it.
 */
export function ContactForm() {
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [serverMessage, setServerMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
  });

  async function onSubmit(values: ContactFormValues) {
    setServerMessage(null);
    try {
      const response = await fetch(`${API_URL}/api/public/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        setSubmitState("success");
        reset();
        return;
      }

      const body = (await response.json().catch(() => null)) as {
        error?: { message?: string };
      } | null;
      setServerMessage(body?.error?.message ?? "Something went wrong. Please try again.");
      setSubmitState("error");
    } catch {
      // Network failure - the connection anxiety docs/ux/USER_JOURNEY_MAP.md
      // Journey 3 identifies as real on an unreliable connection.
      setServerMessage("Couldn't reach the server. Check your connection and try again.");
      setSubmitState("error");
    }
  }

  if (submitState === "success") {
    return (
      <div className={styles.success} role="status">
        Thanks — we&rsquo;ve got your message and someone from Z-GATE will follow up soon.
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
      {submitState === "error" && serverMessage ? (
        <div className={styles.formError} role="alert">
          {serverMessage}
        </div>
      ) : null}

      <div className={styles.field}>
        <label className={styles.label} htmlFor="name">
          Name
        </label>
        <input
          id="name"
          className={styles.input}
          aria-invalid={errors.name ? "true" : "false"}
          aria-describedby={errors.name ? "name-error" : undefined}
          {...register("name")}
        />
        {errors.name ? (
          <span id="name-error" className={styles.errorText}>
            {errors.name.message}
          </span>
        ) : null}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="contact">
          Email or phone
        </label>
        <input
          id="contact"
          className={styles.input}
          aria-invalid={errors.contact ? "true" : "false"}
          aria-describedby={errors.contact ? "contact-error" : undefined}
          {...register("contact")}
        />
        {errors.contact ? (
          <span id="contact-error" className={styles.errorText}>
            {errors.contact.message}
          </span>
        ) : null}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="statedNeed">
          What do you need? (optional)
        </label>
        <textarea
          id="statedNeed"
          className={styles.textarea}
          aria-invalid={errors.statedNeed ? "true" : "false"}
          aria-describedby={errors.statedNeed ? "statedNeed-error" : undefined}
          {...register("statedNeed")}
        />
        {errors.statedNeed ? (
          <span id="statedNeed-error" className={styles.errorText}>
            {errors.statedNeed.message}
          </span>
        ) : null}
      </div>

      <Button type="submit" loading={isSubmitting}>
        Send message
      </Button>
    </form>
  );
}
