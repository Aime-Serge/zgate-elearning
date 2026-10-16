# @zgate/elearning-contracts

What the Z-GATE e-learning platform offers other products. Owned by e-learning; the website links it (by path) in its contract tests, `website/tests/contracts`. Its history goes back to `shared/contracts`.

| Export                                                                                | What it is                                                                                                                |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `openapi/v1.yaml` (also `@zgate/elearning-contracts/openapi/v1.yaml`)                 | The public API, `/api/v1`: `GET /api/v1/public/catalog` and `/api/v1/public/catalog/{slug}`. **Defined, not served yet.** |
| `catalogResponseSchema`, `catalogItemSchema`, `catalogCohortSchema`, `DELIVERY_MODES` | The same catalog payloads as Zod schemas                                                                                  |
| `enrollLinkSchema`, `enrollLinkParamsSchema`, `UTM_PARAMETERS`                        | The enroll-link format: `https://learn.{domain}/courses/{slug}/enroll?cohort=…&utm_source=…`                              |
| `courseSlugSchema`                                                                    | The course join key across products                                                                                       |

## Rules

- Schemas and types only, no I/O. Imports no app and no other workspace package (`pnpm lint:boundaries`).
- **`/api/v1` accepts additive changes only.** CI runs `oasdiff breaking` on `openapi/v1.yaml` against `main` on every pull request and fails on any breaking change.
- `compat/compat.test.ts` fails when a Zod schema removes or renames a field or narrows a type, compared with `compat/published.json` (the agreed baseline), and `compat/openapi.test.ts` keeps the OpenAPI file and the Zod schemas describing the same fields.
- A pull request that changes this package also runs the website's contract tests (`.github/workflows/elearning.yml`, job "Consumer contracts").

## Changing the contract

- **Additive change** (new optional field, new endpoint, wider type): change `openapi/v1.yaml` and the Zod schemas together, then refresh the baseline with `pnpm --filter @zgate/elearning-contracts compat:update` in the same pull request.
- **Breaking change**: not in `/api/v1`. Add the new shape alongside (a new field, or `/api/v2`), move the website over, and only then retire the old one, with the website team's review.
