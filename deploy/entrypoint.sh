#!/bin/sh
set -e

# Run database migrations unless explicitly skipped
if [ "$RUN_MIGRATIONS" != "false" ]; then
    echo "[entrypoint] Running database migrations (alembic upgrade head)..."
    alembic upgrade head
else
    echo "[entrypoint] Skipping database migrations (RUN_MIGRATIONS=false)."
fi

# Execute main container command
echo "[entrypoint] Starting application: $@"
exec "$@"
