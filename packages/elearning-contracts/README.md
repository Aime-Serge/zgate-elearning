# @zgate/contracts

Zod schemas for every piece of data the **website** and the **e-learning platform** exchange. This is the _only_ place the two products meet (ADR-007): neither imports the other.

Today: `courseSlugSchema`, the course join key. The website owns a course's marketing copy, the LMS owns its price, intakes and seats.

Planned (ADR-007, `docs/platform-v2/02-TARGET-ARCHITECTURE.md` §6): public catalog item, the `course.published` webhook payload, the enroll-link format.

Rules: schemas and types only, with no I/O. No imports from `website/`, `elearning/` or `legacy/`.
