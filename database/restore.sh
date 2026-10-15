#!/usr/bin/env bash
# Restore an e-learning backup made by backup.sh into an EXISTING, empty
# database (pg_restore). Test restores go into a scratch database, never
# the live one.
#
#   restore.sh <dump file>
# Connection: PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE (the target).
#   BACKUP_AGE_IDENTITY   age identity file, for .age dumps
#   RESTORE_CONFIRM=yes   required: restoring replaces objects in PGDATABASE
set -euo pipefail

dump="${1:?usage: restore.sh <dump file>}"
: "${PGDATABASE:?set PGDATABASE to the target database}"
if [[ "${RESTORE_CONFIRM:-}" != "yes" ]]; then
  echo "Refusing to restore into '$PGDATABASE' without RESTORE_CONFIRM=yes" >&2
  exit 1
fi

if [[ "$dump" == *.age ]]; then
  : "${BACKUP_AGE_IDENTITY:?set BACKUP_AGE_IDENTITY to decrypt $dump}"
  age -d -i "$BACKUP_AGE_IDENTITY" "$dump" |
    pg_restore --clean --if-exists --no-owner --exit-on-error --dbname="$PGDATABASE"
else
  pg_restore --clean --if-exists --no-owner --exit-on-error --dbname="$PGDATABASE" "$dump"
fi
echo "restored $dump into $PGDATABASE"
