-- Local development only: the e-learning database and its user. The
-- website has its own Postgres now (website/deploy/compose.yml).
--
-- Postgres runs this once, when the data volume is first created. On an
-- older volume, run it manually or reset with `docker compose down -v`.
-- Passwords are dev-only throwaway values, like POSTGRES_PASSWORD in website.yml and elearning.yml.

CREATE USER zgate_elearning WITH PASSWORD 'zgate_elearning_dev';
CREATE DATABASE zgate_elearning OWNER zgate_elearning;
REVOKE ALL ON DATABASE zgate_elearning FROM PUBLIC;
