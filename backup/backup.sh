#!/bin/sh

notify_failure() {
    echo "Backup script failed!"
    if [ -n "$HEALTHCHECKS_PING_URL" ]; then
        curl -fsS -m 10 --retry 5 -o /dev/null "${HEALTHCHECKS_PING_URL}/fail" || true
    fi
    exit 1
}

echo "Waiting for PostgreSQL to be ready before starting..."
until pg_isready -h postgres -U "$POSTGRES_USER" -d "$POSTGRES_DB"; do
    sleep 5
done

BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DUMP_FILE="$BACKUP_DIR/db_backup_${TIMESTAMP}.dump"

echo "Running pg_dump to save to $DUMP_FILE..."
if ! pg_dump -h postgres -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc > "$DUMP_FILE"; then
    notify_failure
fi

echo "Uploading to Azure Blob Storage using azcopy..."
AZURE_DEST="https://${AZURE_STORAGE_ACCOUNT}.blob.core.windows.net/${AZURE_STORAGE_CONTAINER}/db_backup_${TIMESTAMP}.dump"

if ! azcopy copy "$DUMP_FILE" "$AZURE_DEST" --account-key "$AZURE_STORAGE_KEY"; then
    notify_failure
fi

echo "Upload successful."
if [ -n "$HEALTHCHECKS_PING_URL" ]; then
    curl -fsS -m 10 --retry 5 -o /dev/null "$HEALTHCHECKS_PING_URL" || true
fi

echo "Deleting local dumps older than 3 days..."
find "$BACKUP_DIR" -maxdepth 1 -name "db_backup_*.dump" -type f -mtime +3 -delete

echo "Backup process completed successfully."
exit 0
