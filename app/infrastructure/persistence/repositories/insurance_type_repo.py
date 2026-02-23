"""Insurance type repository. Tenant-scoped CRUD."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dtos.reference_data import (
    InsuranceTypeCreate,
    InsuranceTypeResult,
    InsuranceTypeUpdate,
)
from app.infrastructure.persistence.models.insurance_type import InsuranceType


def _to_result(i: InsuranceType) -> InsuranceTypeResult:
    return InsuranceTypeResult(
        id=i.id,
        tenant_id=i.tenant_id,
        name=i.name,
        code=i.code,
        status=i.status,
    )


class InsuranceTypeRepository:
    def __init__(self, db: AsyncSession, tenant_id: str) -> None:
        self.db = db
        self.tenant_id = tenant_id

    async def get_by_id(self, entity_id: str) -> InsuranceTypeResult | None:
        r = await self.db.execute(
            select(InsuranceType).where(
                InsuranceType.id == entity_id,
                InsuranceType.tenant_id == self.tenant_id,
            )
        )
        i = r.scalar_one_or_none()
        return _to_result(i) if i else None

    async def list_by_tenant(
        self, skip: int = 0, limit: int = 100, status: str | None = None
    ) -> list[InsuranceTypeResult]:
        q = select(InsuranceType).where(
            InsuranceType.tenant_id == self.tenant_id
        )
        if status is not None:
            q = q.where(InsuranceType.status == status)
        q = q.offset(skip).limit(limit).order_by(InsuranceType.name)
        r = await self.db.execute(q)
        return [_to_result(i) for i in r.scalars().all()]

    async def create(self, data: InsuranceTypeCreate) -> InsuranceTypeResult:
        i = InsuranceType(
            tenant_id=self.tenant_id,
            name=data.name.strip(),
            code=data.code.strip() if data.code else None,
            status=data.status,
        )
        self.db.add(i)
        await self.db.flush()
        await self.db.refresh(i)
        return _to_result(i)

    async def update(
        self, entity_id: str, data: InsuranceTypeUpdate
    ) -> InsuranceTypeResult | None:
        r = await self.db.execute(
            select(InsuranceType).where(
                InsuranceType.id == entity_id,
                InsuranceType.tenant_id == self.tenant_id,
            )
        )
        i = r.scalar_one_or_none()
        if not i:
            return None
        if data.name is not None:
            i.name = data.name.strip()
        if data.code is not None:
            i.code = data.code.strip() or None
        if data.status is not None:
            i.status = data.status
        await self.db.flush()
        await self.db.refresh(i)
        return _to_result(i)
