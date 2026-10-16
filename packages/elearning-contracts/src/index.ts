/**
 * @zgate/elearning-contracts - what the Z-GATE e-learning platform offers
 * other products to depend on (provider-owned contract, ../README.md).
 *
 *  - The public catalog API, `GET /api/v1/public/catalog`: openapi/v1.yaml
 *    and the Zod schemas in catalog.ts.
 *  - The enroll-link format the website's "Enroll" buttons use:
 *    enrollLink.ts.
 *  - The course join key: courseSlug.ts.
 *
 * Schemas and types only, no I/O. `/api/v1` accepts additive changes only;
 * removing or renaming a field, or narrowing a type, is never done in place
 * (compat/compat.test.ts and the oasdiff check in CI enforce this).
 */
export * from "./catalog.ts";
export * from "./courseSlug.ts";
export * from "./enrollLink.ts";
