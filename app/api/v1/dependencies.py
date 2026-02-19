"""Composition root: all FastAPI Depends for DB, repos, and use cases.

Routes depend only on these; no direct repo/service construction in routes.
"""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.use_cases.companies import CompanyService
from app.application.use_cases.tenants import TenantService
from app.core.config import get_settings
from app.core.tenant_validation import is_valid_tenant_id_format
from app.infrastructure.persistence.database import get_db, get_db_transactional
from app.infrastructure.persistence.repositories.company_repo import CompanyRepository
from app.infrastructure.persistence.repositories.tenant_repo import TenantRepository

# Read-only session (GET, list)
GetDb = Annotated[AsyncSession, Depends(get_db)]
# Transactional session (POST, PATCH, PUT, DELETE)
GetDbTransactional = Annotated[AsyncSession, Depends(get_db_transactional)]


async def get_tenant_repo(db: GetDb) -> TenantRepository:
    """Tenant repository for read operations (e.g. get_tenant_id validation)."""
    return TenantRepository(db)


async def get_tenant_id(
    request: Request,
    tenant_repo: Annotated[TenantRepository, Depends(get_tenant_repo)],
) -> str:
    """Resolve tenant ID from X-Tenant-ID header and validate it exists. Raises 400 if missing or invalid."""
    name = get_settings().tenant_header_name
    value = request.headers.get(name)
    if not value:
        raise HTTPException(
            status_code=400,
            detail=f"Missing required header: {name}",
        )
    if not is_valid_tenant_id_format(value):
        raise HTTPException(
            status_code=400,
            detail="Invalid tenant ID format (alphanumeric, hyphen, underscore; max 64 characters)",
        )
    tenant = await tenant_repo.get_by_id(value)
    if not tenant:
        raise HTTPException(status_code=400, detail="Invalid or unknown tenant")
    return value


async def get_tenant_service(db: GetDbTransactional) -> TenantService:
    """Tenant service for create/list/get (transactional session)."""
    repo = TenantRepository(db)
    return TenantService(repo)


async def get_company_service(
    db: GetDbTransactional,
    tenant_id: Annotated[str, Depends(get_tenant_id)],
) -> CompanyService:
    """Company service (transactional, tenant-scoped). Requires X-Tenant-ID."""
    repo = CompanyRepository(db, tenant_id)
    return CompanyService(repo)


__all__ = [
    "GetDb",
    "GetDbTransactional",
    "get_company_service",
    "get_db",
    "get_db_transactional",
    "get_tenant_id",
    "get_tenant_repo",
    "get_tenant_service",
]
