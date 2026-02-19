"""Tenant service: create, get, list."""

from __future__ import annotations

from typing import TYPE_CHECKING

from app.application.dtos.tenant import TenantCreate, TenantResult
from app.domain.enums import TenantStatus
from app.domain.exceptions import ResourceNotFoundException, ValidationException

if TYPE_CHECKING:
    from app.application.interfaces.repositories import ITenantRepository


class TenantService:
    """Tenant use cases. Depends on ITenantRepository."""

    def __init__(self, tenant_repo: ITenantRepository) -> None:
        self.tenant_repo = tenant_repo

    async def create_tenant(self, data: TenantCreate) -> TenantResult:
        """Create a tenant. Validates code uniqueness and status."""
        if data.status not in TenantStatus.values():
            raise ValidationException(
                f"Invalid status: {data.status}. Must be one of {TenantStatus.values()}",
                field="status",
            )
        existing = await self.tenant_repo.get_by_code(data.code.strip())
        if existing:
            raise ValidationException(
                "A tenant with this code already exists",
                field="code",
            )
        return await self.tenant_repo.create(data)

    async def get_by_id(self, tenant_id: str) -> TenantResult:
        """Get tenant by ID. Raises ResourceNotFoundException if not found."""
        tenant = await self.tenant_repo.get_by_id(tenant_id)
        if not tenant:
            raise ResourceNotFoundException("Tenant not found")
        return tenant

    async def list_tenants(self, skip: int = 0, limit: int = 100) -> list[TenantResult]:
        """List tenants with pagination."""
        return await self.tenant_repo.list_all(skip=skip, limit=limit)
