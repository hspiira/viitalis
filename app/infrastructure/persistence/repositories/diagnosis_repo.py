"""Diagnosis catalog repository. Tenant-scoped."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dtos.catalog import CatalogItemCreate, CatalogItemResult, CatalogItemUpdate
from app.infrastructure.persistence.models.diagnosis import Diagnosis


def _to_result(m: Diagnosis) -> CatalogItemResult:
    return CatalogItemResult(id=m.id, tenant_id=m.tenant_id, name=m.name, code=m.code)


class DiagnosisRepository:
    def __init__(self, db: AsyncSession, tenant_id: str) -> None:
        self.db = db
        self.tenant_id = tenant_id

    async def get_by_id(self, item_id: str) -> CatalogItemResult | None:
        r = await self.db.execute(
            select(Diagnosis).where(
                Diagnosis.id == item_id, Diagnosis.tenant_id == self.tenant_id
            )
        )
        m = r.scalar_one_or_none()
        return _to_result(m) if m else None

    async def list_by_tenant(self, skip: int = 0, limit: int = 100) -> list[CatalogItemResult]:
        r = await self.db.execute(
            select(Diagnosis)
            .where(Diagnosis.tenant_id == self.tenant_id)
            .offset(skip)
            .limit(limit)
            .order_by(Diagnosis.name)
        )
        return [_to_result(m) for m in r.scalars().all()]

    async def create(self, data: CatalogItemCreate) -> CatalogItemResult:
        m = Diagnosis(
            tenant_id=self.tenant_id,
            name=data.name.strip(),
            code=data.code.strip() if data.code else None,
        )
        self.db.add(m)
        await self.db.flush()
        await self.db.refresh(m)
        return _to_result(m)

    async def update(self, item_id: str, data: CatalogItemUpdate) -> CatalogItemResult | None:
        r = await self.db.execute(
            select(Diagnosis).where(
                Diagnosis.id == item_id, Diagnosis.tenant_id == self.tenant_id
            )
        )
        m = r.scalar_one_or_none()
        if not m:
            return None
        if data.name is not None:
            m.name = data.name.strip()
        if data.code is not None:
            m.code = data.code.strip() or None
        await self.db.flush()
        await self.db.refresh(m)
        return _to_result(m)
