"""Hospital repository. Tenant-scoped."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dtos.hospital import HospitalCreate, HospitalResult, HospitalUpdate
from app.infrastructure.persistence.models.hospital import Hospital


def _to_result(h: Hospital) -> HospitalResult:
    return HospitalResult(id=h.id, tenant_id=h.tenant_id, name=h.name, address=h.address)


class HospitalRepository:
    def __init__(self, db: AsyncSession, tenant_id: str) -> None:
        self.db = db
        self.tenant_id = tenant_id

    async def get_by_id(self, hospital_id: str) -> HospitalResult | None:
        r = await self.db.execute(
            select(Hospital).where(
                Hospital.id == hospital_id, Hospital.tenant_id == self.tenant_id
            )
        )
        h = r.scalar_one_or_none()
        return _to_result(h) if h else None

    async def list_by_tenant(self, skip: int = 0, limit: int = 100) -> list[HospitalResult]:
        r = await self.db.execute(
            select(Hospital)
            .where(Hospital.tenant_id == self.tenant_id)
            .offset(skip)
            .limit(limit)
            .order_by(Hospital.name)
        )
        return [_to_result(h) for h in r.scalars().all()]

    async def create(self, data: HospitalCreate) -> HospitalResult:
        h = Hospital(
            tenant_id=self.tenant_id,
            name=data.name.strip(),
            address=data.address.strip() if data.address else None,
        )
        self.db.add(h)
        await self.db.flush()
        await self.db.refresh(h)
        return _to_result(h)

    async def update(self, hospital_id: str, data: HospitalUpdate) -> HospitalResult | None:
        r = await self.db.execute(
            select(Hospital).where(
                Hospital.id == hospital_id, Hospital.tenant_id == self.tenant_id
            )
        )
        h = r.scalar_one_or_none()
        if not h:
            return None
        if data.name is not None:
            h.name = data.name.strip()
        if data.address is not None:
            h.address = data.address.strip() or None
        await self.db.flush()
        await self.db.refresh(h)
        return _to_result(h)
