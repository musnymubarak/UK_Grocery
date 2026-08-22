FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set work directory
WORKDIR /app

# Install system dependencies. The base image's default apt repo only ships a
# newer postgresql-client (e.g. 17) than this project's Postgres server (15,
# postgres:15-alpine everywhere in compose) — a pg_dump that new writes a custom
# -Fc archive format pg_restore-15 can't read at all ("unsupported version in
# file header"), which would make every backup silently unrestorable. Pull the
# exact matching major version from the official PGDG apt repo instead.
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    && curl -fsSL -o /etc/apt/trusted.gpg.d/postgresql.asc https://www.postgresql.org/media/keys/ACCC4CF8.asc \
    && echo "deb https://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends postgresql-client-15 \
    && apt-get purge -y --auto-remove curl gnupg lsb-release \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY app/ /app/app/
COPY alembic/ /app/alembic/
COPY alembic.ini /app/alembic.ini

# Create directory for uploads and local backups
RUN mkdir -p /app/uploads /app/backups

# Expose port
EXPOSE 8000

# Command to run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
