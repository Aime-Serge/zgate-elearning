# E-learning contract tests

Prove the e-learning platform works with the contracts the **website** owns:

| Test                             | Contract                                                                                                                                                                                                  |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/websiteLeadWebhook.test.ts` | `@zgate/website-contracts`: every lead the website can send fits the CRM intake. The endpoint-level test is a Vitest `todo` (reported as such, never as passed) until `POST /api/v1/public/leads` exists. |
| `src/brandUi.test.ts`            | `@zgate/brand-ui`: the tokens e-learning relies on exist and stay readable                                                                                                                                |

The website's packages are installed from `vendor/`, checksummed snapshots of the website repository's versions, as `file:` dependencies (a copy, with their own dependencies). To test against newer versions, run `node scripts/sync-contracts.mjs --from <website checkout>`, then `pnpm install` (`vendor/README.md`).

They run in this repository's CI. When a website contract changes, the website team syncs it here in a pull request, so these tests run against it before e-learning relies on it.
