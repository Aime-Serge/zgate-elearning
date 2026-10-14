import { z } from "zod";

export const loginInputSchema = z.object({
  email: z.string().trim().min(1, "Enter your email.").email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export type LoginInput = z.infer<typeof loginInputSchema>;

export const passwordResetRequestSchema = z.object({
  email: z.string().trim().min(1, "Enter your email.").email("Enter a valid email address."),
});

export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;

export const passwordResetConfirmSchema = z.object({
  token: z.string().min(1, "This reset link is invalid."),
  // No maximum that would block a strong passphrase; 200 chars is a
  // request-size bound, not a policy choice (docs/security/
  // SECURITY_REQUIREMENTS.md V2).
  newPassword: z.string().min(10, "Password must be at least 10 characters.").max(200),
});

export type PasswordResetConfirmInput = z.infer<typeof passwordResetConfirmSchema>;
