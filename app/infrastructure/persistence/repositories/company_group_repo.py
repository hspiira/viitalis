"""Company group repository. Tenant-scoped CRUD."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dtos.reference_data import (
    CompanyGroupCreate,
    CompanyGroupResult,
    CompanyGroupUpdate,
)
from app.infrastructure.persistence.models.company_group import CompanyGroup


def _to_result(c: CompanyGroup) -> CompanyGroupResult:
    return CompanyGroupResult(
        id=c.id,
        tenant_id=c.tenant_id,
        name=c.name,
        description=c.description,
        status=c.status,
    )


class CompanyGroupRepository:
    def __init__(self, db: AsyncSession, tenant_id: str) -> None:
        self.db = db
        self.tenant_id = tenant_id

    async def get_by_id(self, entity_id: str) -> CompanyGroupResult | None:
        r = await self.db.execute(
            select(CompanyGroup).where(
                CompanyGroup.id == entity_id,
                CompanyGroup.tenant_id == self.tenant_id,
            )
        )
        c = r.scalar_one_or_none()
        return _to_result(c) if c else None

    async def list_by_tenant(
        self, skip: int = 0, limit: int = 100, status: str | None = None
    ) -> list[CompanyGroupResult]:
        q = select(CompanyGroup).where(CompanyGroup.tenant_id == self.tenant_id)
        if status is not None:
            q = q.where(CompanyGroup.status == status)
        q = q.offset(skip).limit(limit).order_by(CompanyGroup.name)
        r = await self.db.execute(q)
        return [_to_result(c) for c in r.scalars().all()]

    async def create(self, data: CompanyGroupCreate) -> CompanyGroupResult:
        c = CompanyGroup(
            tenant_id=self.tenant_id,
            name=data.name.strip(),
            description=data.description.strip() if data.description else None,
            status=data.status,
        )
        self.db.add(c)
        await self.db.flush()
        await self.db.refresh(c)
        return _to_result(c)

    async def update(
        self, entity_id: str, data: CompanyGroupUpdate
    ) -> CompanyGroupResult | None:
        r = await self.db.execute(
            select(CompanyGroup).where(
                CompanyGroup.id == entity_id,
                CompanyGroup.tenant_id == self.tenant_id,
            )
        )
        c = r.scalar_one_or_none()
        if not c:
            return None
        if data.name is not None:
            c.name = data.name.strip()
        if data.description is not None:
            c.description = data.description.strip() or None
        if data.status is not None:
            c.status = data.status
        await self.db.flush()
        await self.db.refresh(c)
        return _to_result(c)
