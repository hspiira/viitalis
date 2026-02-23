"""Company type repository. Tenant-scoped CRUD."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dtos.reference_data import (
    CompanyTypeCreate,
    CompanyTypeResult,
    CompanyTypeUpdate,
)
from app.infrastructure.persistence.models.company_type import CompanyType


def _to_result(c: CompanyType) -> CompanyTypeResult:
    return CompanyTypeResult(
        id=c.id,
        tenant_id=c.tenant_id,
        name=c.name,
        code=c.code,
        description=c.description,
        status=c.status,
    )


class CompanyTypeRepository:
    def __init__(self, db: AsyncSession, tenant_id: str) -> None:
        self.db = db
        self.tenant_id = tenant_id

    async def get_by_id(self, entity_id: str) -> CompanyTypeResult | None:
        r = await self.db.execute(
            select(CompanyType).where(
                CompanyType.id == entity_id,
                CompanyType.tenant_id == self.tenant_id,
            )
        )
        c = r.scalar_one_or_none()
        return _to_result(c) if c else None

    async def list_by_tenant(
        self, skip: int = 0, limit: int = 100, status: str | None = None
    ) -> list[CompanyTypeResult]:
        q = select(CompanyType).where(CompanyType.tenant_id == self.tenant_id)
        if status is not None:
            q = q.where(CompanyType.status == status)
        q = q.offset(skip).limit(limit).order_by(CompanyType.name)
        r = await self.db.execute(q)
        return [_to_result(c) for c in r.scalars().all()]

    async def create(self, data: CompanyTypeCreate) -> CompanyTypeResult:
        c = CompanyType(
            tenant_id=self.tenant_id,
            name=data.name.strip(),
            code=data.code.strip() if data.code else None,
            description=data.description.strip() if data.description else None,
            status=data.status,
        )
        self.db.add(c)
        await self.db.flush()
        await self.db.refresh(c)
        return _to_result(c)

    async def update(
        self, entity_id: str, data: CompanyTypeUpdate
    ) -> CompanyTypeResult | None:
        r = await self.db.execute(
            select(CompanyType).where(
                CompanyType.id == entity_id,
                CompanyType.tenant_id == self.tenant_id,
            )
        )
        c = r.scalar_one_or_none()
        if not c:
            return None
        if data.name is not None:
            c.name = data.name.strip()
        if data.code is not None:
            c.code = data.code.strip() or None
        if data.description is not None:
            c.description = data.description.strip() or None
        if data.status is not None:
            c.status = data.status
        await self.db.flush()
        await self.db.refresh(c)
        return _to_result(c)
