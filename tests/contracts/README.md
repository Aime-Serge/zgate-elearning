# E-learning contract tests

Prove the e-learning platform works with the contracts the **website** owns:

| Test                             | Contract                                                                                                                                                                                                  |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/websiteLeadWebhook.test.ts` | `@zgate/website-contracts`: every lead the website can send fits the CRM intake. The endpoint-level test is a Vitest `todo` (reported as such, never as passed) until `POST /api/v1/public/leads` exists. |
| `src/brandUi.test.ts`            | `@zgate/brand-ui`: the tokens e-learning relies on exist and stay readable                                                                                                                                |

The website's packages are installed as `file:` dependencies (a copy, with their own dependencies), so this workspace installs on its own. After changing a website package locally, run `pnpm install` here to pick the change up; CI always installs fresh.

They run in e-learning CI and, whenever a pull request changes one of those website packages, in the website's CI too ("Consumer contracts").
