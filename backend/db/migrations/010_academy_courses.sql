-- courses: fixed catalog of Academy offerings (docs/database/DATA_MODEL.md
-- entity #20, docs/product/PRODUCT_BACKLOG.md FEAT-08.1). No "staff
-- creates a course" workflow is backlogged - the catalog is small and
-- curriculum-approved, not self-service - so this table is seeded here
-- with the two real, already-approved courses (the same content already
-- live on the public Academy page, apps/web/src/lib/content.ts's
-- academyCourses) rather than left empty pending an admin UI that no
-- approved feature calls for.

CREATE TABLE courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  audience text NOT NULL,
  duration text NOT NULL,
  fee text NOT NULL,
  -- Drives the attendance checklist's session count (FEAT-08.3) and the
  -- assessment pass threshold's session-completion basis.
  total_sessions integer NOT NULL CHECK (total_sessions > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO courses (name, audience, duration, fee, total_sessions) VALUES
  (
    'Tax & Bookkeeping Fundamentals for Small Business Owners',
    'SME owners and staff; no prior accounting background required',
    '4 weeks — 8 sessions, 1.5 hrs each',
    'RWF 40,000 per learner',
    8
  ),
  (
    'EBM & Digital Invoicing Mastery',
    'SME owners and staff who issue or are required to issue EBM receipts',
    '2 weeks — 4 sessions, 1.5 hrs each',
    'RWF 40,000 per learner',
    4
  );
