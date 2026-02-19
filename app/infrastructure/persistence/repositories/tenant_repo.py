"""Tenant repository. Returns application DTOs."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dtos.tenant import TenantCreate, TenantResult
from app.infrastructure.persistence.models.tenant import Tenant


def _tenant_to_result(t: Tenant) -> TenantResult:
    """Map ORM Tenant to TenantResult."""
    return TenantResult(id=t.id, code=t.code, name=t.name, status=t.status)


class TenantRepository:
    """Tenant repository. Implements ITenantRepository."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_id(self, tenant_id: str) -> TenantResult | None:
        """Return tenant by ID."""
        result = await self.db.execute(select(Tenant).where(Tenant.id == tenant_id))
        tenant = result.scalar_one_or_none()
        return _tenant_to_result(tenant) if tenant else None

    async def get_by_code(self, code: str) -> TenantResult | None:
        """Return tenant by code."""
        result = await self.db.execute(select(Tenant).where(Tenant.code == code))
        tenant = result.scalar_one_or_none()
        return _tenant_to_result(tenant) if tenant else None

    async def list_all(self, skip: int = 0, limit: int = 100) -> list[TenantResult]:
        """Return tenants with pagination."""
        result = await self.db.execute(
            select(Tenant).offset(skip).limit(limit).order_by(Tenant.code)
        )
        tenants = result.scalars().all()
        return [_tenant_to_result(t) for t in tenants]

    async def create(self, data: TenantCreate) -> TenantResult:
        """Create a tenant. Returns the created tenant."""
        tenant = Tenant(
            code=data.code.strip(),
            name=data.name.strip(),
            status=data.status,
        )
        self.db.add(tenant)
        await self.db.flush()
        await self.db.refresh(tenant)
        return _tenant_to_result(tenant)
