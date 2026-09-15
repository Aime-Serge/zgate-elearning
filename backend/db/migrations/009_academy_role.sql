-- Activates the staff_academy role (RBAC_SECURITY_MODEL.md: "Academy
-- Trainer... Academy-division data only, for cohorts they're assigned
-- to") - deferred until Academy's own phase, per docs/database/
-- DATA_MODEL.md's users.role note ("staff_academy, staff_tech,
-- staff_data activate with their modules").

ALTER TYPE user_role ADD VALUE 'staff_academy';
