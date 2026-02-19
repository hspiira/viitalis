"""Medical condition repository. Tenant-scoped CRUD."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dtos.reference_data import (
    MedicalConditionCreate,
    MedicalConditionResult,
    MedicalConditionUpdate,
)
from app.infrastructure.persistence.models.medical_condition import MedicalCondition


def _to_result(m: MedicalCondition) -> MedicalConditionResult:
    return MedicalConditionResult(
        id=m.id,
        tenant_id=m.tenant_id,
        name=m.name,
        code=m.code,
        status=m.status,
    )


class MedicalConditionRepository:
    def __init__(self, db: AsyncSession, tenant_id: str) -> None:
        self.db = db
        self.tenant_id = tenant_id

    async def get_by_id(self, entity_id: str) -> MedicalConditionResult | None:
        r = await self.db.execute(
            select(MedicalCondition).where(
                MedicalCondition.id == entity_id,
                MedicalCondition.tenant_id == self.tenant_id,
            )
        )
        m = r.scalar_one_or_none()
        return _to_result(m) if m else None

    async def list_by_tenant(
        self, skip: int = 0, limit: int = 100, status: str | None = None
    ) -> list[MedicalConditionResult]:
        q = select(MedicalCondition).where(
            MedicalCondition.tenant_id == self.tenant_id
        )
        if status is not None:
            q = q.where(MedicalCondition.status == status)
        q = q.offset(skip).limit(limit).order_by(MedicalCondition.name)
        r = await self.db.execute(q)
        return [_to_result(m) for m in r.scalars().all()]

    async def create(
        self, data: MedicalConditionCreate
    ) -> MedicalConditionResult:
        m = MedicalCondition(
            tenant_id=self.tenant_id,
            name=data.name.strip(),
            code=data.code.strip() if data.code else None,
            status=data.status,
        )
        self.db.add(m)
        await self.db.flush()
        await self.db.refresh(m)
        return _to_result(m)

    async def update(
        self, entity_id: str, data: MedicalConditionUpdate
    ) -> MedicalConditionResult | None:
        r = await self.db.execute(
            select(MedicalCondition).where(
                MedicalCondition.id == entity_id,
                MedicalCondition.tenant_id == self.tenant_id,
            )
        )
        m = r.scalar_one_or_none()
        if not m:
            return None
        if data.name is not None:
            m.name = data.name.strip()
        if data.code is not None:
            m.code = data.code.strip() or None
        if data.status is not None:
            m.status = data.status
        await self.db.flush()
        await self.db.refresh(m)
        return _to_result(m)
