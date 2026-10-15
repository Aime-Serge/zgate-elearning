#!/usr/bin/env bash
# Logical backup of the e-learning database (pg_dump custom format).
#
# Connection: the standard libpq variables - PGHOST, PGPORT, PGUSER,
# PGPASSWORD (or ~/.pgpass), PGDATABASE (default zgate_elearning).
#   BACKUP_DIR              where dumps go (required)
#   BACKUP_RETENTION_DAYS   delete dumps older than this (default 30)
#   BACKUP_AGE_RECIPIENT    if set, encrypt with `age -r` (recommended:
#                           the dump holds learner, client and payment data)
#
# A secondary, nightly safety net: the primary target is point-in-time
# recovery from archived WAL, at most 15 minutes of data loss
# (database/README.md). Copy BACKUP_DIR off the host.
set -euo pipefail

: "${BACKUP_DIR:?set BACKUP_DIR}"
export PGDATABASE="${PGDATABASE:-zgate_elearning}"
retention="${BACKUP_RETENTION_DAYS:-30}"
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$BACKUP_DIR"

if [[ -n "${BACKUP_AGE_RECIPIENT:-}" ]]; then
  file="$BACKUP_DIR/$PGDATABASE-$stamp.dump.age"
  pg_dump --format=custom --no-owner | age -r "$BACKUP_AGE_RECIPIENT" > "$file"
else
  file="$BACKUP_DIR/$PGDATABASE-$stamp.dump"
  pg_dump --format=custom --no-owner --file="$file"
fi

find "$BACKUP_DIR" -name "$PGDATABASE-*.dump*" -type f -mtime "+$retention" -delete
echo "backup written: $file"
