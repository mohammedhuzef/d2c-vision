"""LaunchTwin AI — Root Application Entrypoint.

Exposes the primary FastAPI application instance from `backend.app.main:app`
so that running either `uvicorn main:app` or `python -m uvicorn backend.app.main:app`
correctly launches the full platform.
"""

from backend.app.main import app

__all__ = ["app"]
