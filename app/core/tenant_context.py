"""Tenant context for request-scoped tenant_id.

Middleware sets the current tenant_id in this context variable so that
database sessions (Postgres) can run SET LOCAL app.current_tenant_id for RLS.
Oracle relies on repository-level tenant_id filtering.
"""

from contextvars import ContextVar

current_tenant_id: ContextVar[str | None] = ContextVar(
    "current_tenant_id", default=None
)


def set_tenant_id(tenant_id: str | None) -> None:
    """Set the current tenant ID for this context (e.g. request)."""
    current_tenant_id.set(tenant_id)


def get_tenant_id() -> str | None:
    """Return the current tenant ID if set."""
    return current_tenant_id.get()
