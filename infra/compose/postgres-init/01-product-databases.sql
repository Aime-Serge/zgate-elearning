-- Local development only: one Postgres server, one database and one user
-- per product (ADR-007). The website and the e-learning platform never
-- share a database - both have a `users` table - and each product's user
-- can only reach its own database.
--
-- Postgres runs this once, when the data volume is first created. On an
-- older volume, run it manually or reset with `docker compose down -v`.
-- Passwords are dev-only throwaway values, like POSTGRES_PASSWORD in website.yml and elearning.yml.

CREATE USER zgate_website WITH PASSWORD 'zgate_website_dev';
CREATE DATABASE zgate_website OWNER zgate_website;
REVOKE ALL ON DATABASE zgate_website FROM PUBLIC;

CREATE USER zgate_elearning WITH PASSWORD 'zgate_elearning_dev';
CREATE DATABASE zgate_elearning OWNER zgate_elearning;
REVOKE ALL ON DATABASE zgate_elearning FROM PUBLIC;
