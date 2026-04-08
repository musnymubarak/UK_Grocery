# POS Database Backup and Restore Runbook

## Overview
This runbook covers the manual restore procedure, triggering manual backups, and retrieving backups from Azure Blob Storage. It documents the newly implemented automated backup and disaster recovery architecture.

## RPO & RTO Expectations
* **Recovery Point Objective (RPO):** Up to 24 hours of data loss max with nightly backups. (Note: continuous WAL archiving is a tracked follow-up ticket).
* **Recovery Time Objective (RTO):** 15–30 minutes depending on download speed.

## How to Trigger a Manual Backup
To manually create a new backup and upload it to Azure Blob Storage immediately, execute the `backup.sh` script inside the running sidecar container:
```bash
docker exec -it pos_db_backup /app/backup.sh
```

## How to Download a Specific Backup from Azure Blob Storage
You can use `azcopy` directly from the server or any machine with azcopy installed. First export your credentials which are located in `.env`:
```bash
export AZURE_STORAGE_ACCOUNT="your_account"
export AZURE_STORAGE_KEY="your_key"
```
To list all backups in the container:
```bash
azcopy list "https://${AZURE_STORAGE_ACCOUNT}.blob.core.windows.net/pos-backups"
```
To download a specific backup file `db_backup_YYYYMMDD_HHMMSS.dump` to your current directory:
```bash
azcopy copy "https://${AZURE_STORAGE_ACCOUNT}.blob.core.windows.net/pos-backups/db_backup_YYYYMMDD_HHMMSS.dump" ./
```

## Step-by-Step Manual Restore Procedure
**IMPORTANT:** This procedure assumes you have already downloaded the `.dump` file you wish to restore to the host machine.

1. **Stop Application Containers**
   Prevent new transactions and sever connections to the database during the restore operation:
   ```bash
   docker-compose stop backend frontend
   ```

2. **Copy the Dump into the Postgres Container**
   Avoid silent stdin pipe breakages by placing the file directly inside the container before attempting the restore:
   ```bash
   docker cp ./db_backup_YYYYMMDD_HHMMSS.dump pos_postgres:/tmp/db_backup.dump
   ```

3. **Run pg_restore**
   Execute the restore command with `--clean` and `--if-exists` to clear out the target database cleanly before rebuilding it.
   ```bash
   docker exec -i pos_postgres pg_restore -U $POSTGRES_USER -d $POSTGRES_DB --clean --if-exists -Fc /tmp/db_backup.dump
   ```

4. **Clean up and Restart**
   Remove the temporary dump file from the container and bring the applications back online:
   ```bash
   docker exec pos_postgres rm /tmp/db_backup.dump
   docker-compose start backend frontend
   ```

5. **Verify the State**
   Perform a spot check by logging into PostgreSQL:
   ```bash
   docker exec -it pos_postgres psql -U $POSTGRES_USER -d $POSTGRES_DB -c "SELECT count(*) FROM users;"
   ```
