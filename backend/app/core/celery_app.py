"""Celery application configured with Redis broker."""
from celery import Celery
from celery.schedules import crontab
from app.core.config import settings

celery_app = Celery(
    "grocery_tasks",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    broker_connection_retry=False,
    broker_connection_retry_on_startup=False,
    broker_connection_max_retries=0,
)

# autodiscover_tasks(["app.tasks"]) looked for a module named app.tasks.tasks,
# which doesn't exist — every task module below (archival, assignment, maintenance,
# rewards, search, webhooks) was silently never imported, so none of their
# @celery_app.task-decorated functions ever registered. A worker running against
# this app rejected every task, scheduled or not, as "unregistered". Import each
# module explicitly so its decorators actually run at startup.
from app.tasks import archival, assignment, backup, maintenance, rewards, search, webhooks  # noqa: E402,F401

# Celery Beat schedule
celery_app.conf.beat_schedule = {
    "expire-stale-coupons": {
        "task": "app.tasks.maintenance.expire_stale_coupons",
        "schedule": crontab(hour=1, minute=0),  # Daily 01:00 UTC
    },
    "rebuild-search-index": {
        "task": "app.tasks.search.rebuild_search_index",
        "schedule": crontab(hour=3, minute=0),  # Daily at 03:00 UTC
    },
    "order-timeout-check": {
        "task": "app.tasks.maintenance.order_timeout_check",
        "schedule": 120.0,  # Every 2 minutes
    },
    "monthly-rewards-reset": {
        "task": "app.tasks.rewards.run_monthly_rewards_reset",
        "schedule": crontab(hour=23, minute=50, day_of_month=28),  # Last days
    },
    "auto-assign-orders": {
        "task": "app.tasks.assignment.auto_assign_orders",
        "schedule": 60.0,
    },
    "cleanup-maintenance": {
        "task": "app.tasks.archival.cleanup_expired_tokens",
        "schedule": crontab(hour=4, minute=30),
    },
    "nightly-database-backup": {
        "task": "app.tasks.backup.create_database_backup",
        "schedule": crontab(hour=2, minute=0),  # Daily 02:00 UTC
    },
}
