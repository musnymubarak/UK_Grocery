"""Database backup task — nightly pg_dump into a local, rotated volume.

No offsite storage is wired up yet (tracked as a follow-up): this only protects
against bad migrations, application bugs, and human error on this box. It does
NOT protect against losing this server entirely — that still needs an offsite
copy shipped somewhere else.
"""
import os
import subprocess
from datetime import datetime, timezone, timedelta
from pathlib import Path
from urllib.parse import urlparse

import structlog

from app.core.celery_app import celery_app
from app.core.config import settings

log = structlog.get_logger()

BACKUP_DIR = Path("/app/backups")
RETENTION_DAYS = 14


@celery_app.task(name="app.tasks.backup.create_database_backup")
def create_database_backup():
    """Dump the database with pg_dump and prune backups older than RETENTION_DAYS.

    Runs nightly. Raises on failure so a Celery task failure (visible in the
    worker logs / any monitoring on task failures) reflects a real broken backup,
    rather than failing silently.
    """
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)

    parsed = urlparse(settings.DATABASE_URL_SYNC)
    db_name = parsed.path.lstrip("/")
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    dump_path = BACKUP_DIR / f"dailygrocer_{timestamp}.dump"

    env = os.environ.copy()
    if parsed.password:
        env["PGPASSWORD"] = parsed.password

    cmd = [
        "pg_dump",
        "-h", parsed.hostname or "db",
        "-p", str(parsed.port or 5432),
        "-U", parsed.username or "postgres",
        "-Fc",
        "-f", str(dump_path),
        db_name,
    ]

    result = subprocess.run(cmd, env=env, capture_output=True, text=True)
    if result.returncode != 0:
        dump_path.unlink(missing_ok=True)
        log.error("backup.failed", returncode=result.returncode, stderr=result.stderr[-2000:])
        raise RuntimeError(f"pg_dump exited {result.returncode}: {result.stderr[-500:]}")

    size_mb = round(dump_path.stat().st_size / (1024 * 1024), 2)
    log.info("backup.created", file=dump_path.name, size_mb=size_mb)

    pruned = _prune_old_backups()
    return {"file": dump_path.name, "size_mb": size_mb, "pruned": pruned}


def _prune_old_backups() -> list[str]:
    cutoff = datetime.now(timezone.utc) - timedelta(days=RETENTION_DAYS)
    removed = []
    for f in BACKUP_DIR.glob("dailygrocer_*.dump"):
        mtime = datetime.fromtimestamp(f.stat().st_mtime, tz=timezone.utc)
        if mtime < cutoff:
            f.unlink()
            removed.append(f.name)
    if removed:
        log.info("backup.pruned", count=len(removed), files=removed)
    return removed
