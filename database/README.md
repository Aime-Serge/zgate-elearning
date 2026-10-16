# E-learning database

PostgreSQL for the e-learning platform: identity, LMS, commerce, and the v1 operations tables the frozen ops portal still uses. Separate from the website database in every environment, as its own instance in production (ADR-007, ADR-008). The schema lives in `elearning/backend/db/migrations/` and is applied only by `elearning/backend/scripts/migrate.mjs`, never from here.

| File                  | What it is                                                                                                                        |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `init/01-roles.sql`   | Creates `zgate_elearning`, the migration owner `zgate_elearning_owner` and the app role `zgate_elearning_app` (rows only, no DDL) |
| `postgresql.conf`     | Production settings: statement and idle-in-transaction timeouts, slow-query logging; WAL archiving to switch on before go-live    |
| `postgresql.dev.conf` | Local development: the same guard rails with a small memory footprint (`deploy/compose.yml`)                                      |
| `backup.sh`           | `pg_dump` (custom format), optional `age` encryption, retention                                                                   |
| `restore.sh`          | `pg_restore` into an existing empty database; needs `RESTORE_CONFIRM=yes`                                                         |

## Roles

- Migrations run as `zgate_elearning_owner` (`DATABASE_MIGRATION_URL`: `pnpm db:migrate` in elearning/ locally, the `elearning-migrate` job in Compose).
- The API and the worker connect as `zgate_elearning_app`: `SELECT`, `INSERT`, `UPDATE`, `DELETE` on tables the owner creates, through default privileges.
- Restore as the owner role, so restored tables keep the same owner and grants.

## Backup targets

| What                   | Target                                                                                                                                                                                                                                                    |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Point-in-time recovery | **At most 15 minutes of data loss.** Continuous WAL archiving (`archive_timeout` 5 minutes) plus a weekly base backup, with a tool such as pgBackRest or WAL-G, or a managed service's PITR. Not set up yet: required before learners or payments go live |
| Logical backup         | Nightly `backup.sh` as a second, independent copy, encrypted and copied off the host; keep 30 days                                                                                                                                                        |
| Restore test           | Every quarter: a point-in-time restore and a logical restore, each into a scratch database                                                                                                                                                                |

The database will hold learner, client and payment data, so backups are encrypted (`BACKUP_AGE_RECIPIENT`) and stay in Rwanda (ADR-004).

## Example

```bash
PGHOST=data-host.internal PGUSER=zgate_elearning_owner PGDATABASE=zgate_elearning \
  BACKUP_DIR=/var/backups/zgate BACKUP_AGE_RECIPIENT=age1... ./backup.sh

PGDATABASE=zgate_elearning_restore_test RESTORE_CONFIRM=yes \
  BACKUP_AGE_IDENTITY=~/.age/backup.key ./restore.sh /var/backups/zgate/zgate_elearning-<stamp>.dump.age
```
