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
)

# Autodiscover tasks from app.tasks package
celery_app.autodiscover_tasks(["app.tasks"])

# Celery Beat schedule
celery_app.conf.beat_schedule = {
    "expire-stale-coupons": {
        "task": "app.tasks.maintenance.expire_stale_coupons",
        "schedule": crontab(hour=1, minute=0),  # Daily 01:00 UTC
    },
    "order-timeout-check": {
        "task": "app.tasks.maintenance.order_timeout_check",
        "schedule": 120.0,  # Every 2 minutes
    },
    "monthly-rewards-reset": {
        "task": "app.tasks.rewards.run_monthly_rewards_reset",
        "schedule": crontab(hour=23, minute=50, day_of_month=28),  # Last days
    },
}
