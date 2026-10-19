/**
 * @zgate/website-contracts - what the Z-GATE website sends to other
 * systems, offered for them to depend on (provider-owned contract,
 * ../README.md "Contracts").
 *
 *  - The public lead form (contact enquiry, course waitlist): its fields,
 *    validation and attribution - leads/schema.ts.
 *  - Lead intake: how a validated submission is handed over and answered -
 *    leadIntake.ts.
 *  - The lead/waitlist webhook payload for consumers outside the website,
 *    such as the e-learning platform's CRM - leadWebhook.ts.
 *
 * Schemas and types only, no I/O. Semantic versioning: removing or
 * renaming a field, or narrowing a type, is a breaking change and needs a
 * new major version (compat/compat.test.ts checks this).
 */
export * from "./leadIntake.ts";
export * from "./leads/schema.ts";
export * from "./leadWebhook.ts";
