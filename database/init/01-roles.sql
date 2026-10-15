-- E-learning database: roles and the database itself (ADR-008).
--
-- Two roles:
--   zgate_elearning_owner  owns the database and every table; runs
--                          backend/scripts/migrate.mjs (deploy-time only).
--   zgate_elearning_app    what the running API and worker connect as:
--                          read and write rows - no DDL, no TRUNCATE.
--
-- Local development: Postgres runs this once, when the data volume is first
-- created (deploy/compose.yml). The passwords below are dev-only throwaway
-- values. Production: a DBA runs the same statements on the data host with
-- generated passwords (elearning/database/README.md).

CREATE ROLE zgate_elearning_owner WITH LOGIN PASSWORD 'zgate_elearning_owner_dev';
CREATE ROLE zgate_elearning_app WITH LOGIN PASSWORD 'zgate_elearning_app_dev';

-- Migrations may legitimately run longer than the server-wide statement
-- timeout (postgresql.conf).
ALTER ROLE zgate_elearning_owner SET statement_timeout = 0;

CREATE DATABASE zgate_elearning OWNER zgate_elearning_owner;
REVOKE ALL ON DATABASE zgate_elearning FROM PUBLIC;
GRANT CONNECT, TEMPORARY ON DATABASE zgate_elearning TO zgate_elearning_app;

\connect zgate_elearning

-- Only the owner creates objects; the app role just uses them.
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO zgate_elearning_app;

-- Every table and sequence the owner creates later (i.e. by migrations).
ALTER DEFAULT PRIVILEGES FOR ROLE zgate_elearning_owner IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO zgate_elearning_app;
ALTER DEFAULT PRIVILEGES FOR ROLE zgate_elearning_owner IN SCHEMA public
  GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO zgate_elearning_app;
