"use client";

import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiUpload, ApiError } from "@/lib/api";
import type { DeliverableType } from "@/lib/documents";
import { Button } from "./Button";
import styles from "./UploadDeliverableForm.module.css";

const TYPE_OPTIONS: DeliverableType[] = ["report", "filing_copy", "other"];

/**
 * FEAT-06.3 - a file upload plus an existing-deliverables Table
 * (docs/design/PAGE_SPECIFICATIONS.md's Client detail spec). A distinct
 * inline success state confirms the upload without a full-page reload
 * interrupting the Associate's flow.
 */
export function UploadDeliverableForm({
  engagementId,
  onUploaded,
}: {
  engagementId: string;
  onUploaded: () => void;
}) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [type, setType] = useState<DeliverableType>("report");
  const [error, setError] = useState<string | null>(null);
  const [justUploaded, setJustUploaded] = useState(false);

  const mutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("engagementId", engagementId);
      formData.append("type", type);
      formData.append("file", file);
      return apiUpload<{ id: string }>("/api/documents", formData);
    },
    onSuccess: async () => {
      setError(null);
      setJustUploaded(true);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await queryClient.invalidateQueries({ queryKey: ["staff-documents", engagementId] });
      onUploaded();
    },
    onError: (uploadError: unknown) => {
      setJustUploaded(false);
      setError(
        uploadError instanceof ApiError
          ? uploadError.message
          : "Couldn't reach the server. Check your connection and try again.",
      );
    },
  });

  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault();
        setJustUploaded(false);
        const file = fileInputRef.current?.files?.[0];
        if (!file) {
          setError("Choose a file first.");
          return;
        }
        mutation.mutate(file);
      }}
    >
      <h3 className={styles.heading}>Upload a deliverable</h3>

      {error ? (
        <div className={styles.formError} role="alert">
          {error}
        </div>
      ) : null}
      {justUploaded ? (
        <div className={styles.formSuccess} role="status">
          Uploaded — it&rsquo;s now visible in the client&rsquo;s portal.
        </div>
      ) : null}

      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="deliverable-type">
            Type
          </label>
          <select
            id="deliverable-type"
            className={styles.input}
            value={type}
            onChange={(event) => setType(event.target.value as DeliverableType)}
          >
            {TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="deliverable-file">
            File
          </label>
          <input
            id="deliverable-file"
            ref={fileInputRef}
            type="file"
            className={styles.input}
            accept=".pdf,.jpg,.jpeg,.png,.xlsx,.docx"
          />
        </div>
      </div>

      <Button type="submit" loading={mutation.isPending}>
        Upload
      </Button>
    </form>
  );
}
