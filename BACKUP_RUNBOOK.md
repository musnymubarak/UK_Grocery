# POS Database Backup and Restore Runbook

## Overview
Nightly backups run automatically via a Celery beat task (`app.tasks.backup.create_database_backup`,
02:00 UTC) inside the `celery-worker` container, writing to the `postgres_backups` Docker volume
(mounted at `/app/backups` in both `backend` and `celery-worker`). Backups older than 14 days are
pruned automatically. `Jenkinsfile.verify_backup` runs every 30 minutes, confirms a backup newer
than 26 hours exists in that volume, and does a full restore into a throwaway Postgres container to
confirm it's actually valid — a missing or unrestorable backup fails that pipeline (and pages Slack),
it no longer skips silently.

**Known gap:** this is local-only. There is currently no offsite/second-location copy — losing this
server loses the backups along with the live database. Shipping a copy offsite (object storage,
another host, etc.) is a tracked follow-up, not yet implemented.

## RPO & RTO Expectations
* **Recovery Point Objective (RPO):** Up to 24 hours of data loss max with nightly backups, *provided
  this server survives* — the backups live on the same host as the database. (Continuous WAL
  archiving and an offsite copy are both tracked follow-ups.)
* **Recovery Time Objective (RTO):** A few minutes — the backup is already local, no download needed.

To manually trigger a backup on demand instead of waiting for the nightly schedule:
```bash
docker exec daily_grocer_celery_worker python -c "from app.tasks.backup import create_database_backup; print(create_database_backup())"
```

To manually create a one-off backup outside the automated system entirely (e.g. before a risky
migration), the direct `pg_dump` route still works:
```bash
docker exec -t daily_grocer_db pg_dump -U $POSTGRES_USER -d $POSTGRES_DB -Fc > db_backup_$(date +%Y%m%d_%H%M%S).dump
```



## Step-by-Step Manual Restore Procedure

### Restoring from the automated nightly backup (postgres_backups volume)

1. **Find and copy out the backup you want:**
   ```bash
   docker exec daily_grocer_celery_worker ls -la /app/backups/
   docker cp daily_grocer_celery_worker:/app/backups/dailygrocer_YYYYMMDD_HHMMSS.dump ./db_backup.dump
   ```
   Then continue from step 2 below using `./db_backup.dump` in place of the manually-downloaded file.

### Restoring from a manually-downloaded `.dump` file
**IMPORTANT:** This procedure assumes you have already downloaded the `.dump` file you wish to restore to the host machine.

1. **Stop Application Containers**
   Prevent new transactions and sever connections to the database during the restore operation:
   ```bash
   docker-compose stop backend frontend
   ```

2. **Copy the Dump into the Postgres Container**
   Avoid silent stdin pipe breakages by placing the file directly inside the container before attempting the restore:
   ```bash
   docker cp ./db_backup_YYYYMMDD_HHMMSS.dump daily_grocer_db:/tmp/db_backup.dump
   ```

3. **Run pg_restore**
   Execute the restore command with `--clean` and `--if-exists` to clear out the target database cleanly before rebuilding it.
   ```bash
   docker exec -i daily_grocer_db pg_restore -U $POSTGRES_USER -d $POSTGRES_DB --clean --if-exists -Fc /tmp/db_backup.dump
   ```

4. **Clean up and Restart**
   Remove the temporary dump file from the container and bring the applications back online:
   ```bash
   docker exec daily_grocer_db rm /tmp/db_backup.dump
   docker-compose start backend frontend
   ```

5. **Verify the State**
   Perform a spot check by logging into PostgreSQL:
   ```bash
   docker exec -it daily_grocer_db psql -U $POSTGRES_USER -d $POSTGRES_DB -c "SELECT count(*) FROM users;"
   ```
