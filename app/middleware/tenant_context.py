"""Tenant context middleware.

Sets current tenant_id in context from X-Tenant-ID header or JWT payload
so that get_tenant_id() and (Postgres) RLS can use it.
"""

from __future__ import annotations

from typing import Callable

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.core.config import get_settings
from app.core.tenant_context import set_tenant_id
from app.infrastructure.security.jwt import verify_token


def _tenant_id_from_request(request: Request) -> str | None:
    """Return tenant_id from X-Tenant-ID header or JWT payload."""
    settings = get_settings()
    tenant_id = request.headers.get(settings.tenant_header_name)
    if tenant_id:
        return tenant_id
    auth = request.headers.get("Authorization")
    if auth and auth.startswith("Bearer "):
        try:
            payload = verify_token(auth[7:].strip())
            return payload.get("tenant_id")
        except Exception:
            pass
    return None


def TenantContextMiddleware(app: Callable) -> Callable:
    """Set tenant context from header or JWT before route runs."""

    class _Middleware(BaseHTTPMiddleware):
        async def dispatch(self, request: Request, call_next: Callable) -> Response:
            tenant_id = _tenant_id_from_request(request)
            set_tenant_id(tenant_id)
            try:
                return await call_next(request)
            finally:
                set_tenant_id(None)

    return _Middleware(app)
