"""Doctor repository. Tenant-scoped."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dtos.doctor import DoctorCreate, DoctorResult, DoctorUpdate
from app.infrastructure.persistence.models.doctor import Doctor


def _to_result(d: Doctor) -> DoctorResult:
    return DoctorResult(
        id=d.id,
        tenant_id=d.tenant_id,
        hospital_id=d.hospital_id,
        name=d.name,
        specialization=d.specialization,
    )


class DoctorRepository:
    def __init__(self, db: AsyncSession, tenant_id: str) -> None:
        self.db = db
        self.tenant_id = tenant_id

    async def get_by_id(self, doctor_id: str) -> DoctorResult | None:
        r = await self.db.execute(
            select(Doctor).where(
                Doctor.id == doctor_id, Doctor.tenant_id == self.tenant_id
            )
        )
        d = r.scalar_one_or_none()
        return _to_result(d) if d else None

    async def list_by_tenant(
        self, skip: int = 0, limit: int = 100, hospital_id: str | None = None
    ) -> list[DoctorResult]:
        q = select(Doctor).where(Doctor.tenant_id == self.tenant_id)
        if hospital_id is not None:
            q = q.where(Doctor.hospital_id == hospital_id)
        q = q.offset(skip).limit(limit).order_by(Doctor.name)
        r = await self.db.execute(q)
        return [_to_result(d) for d in r.scalars().all()]

    async def create(self, data: DoctorCreate) -> DoctorResult:
        d = Doctor(
            tenant_id=self.tenant_id,
            hospital_id=data.hospital_id,
            name=data.name.strip(),
            specialization=data.specialization.strip() if data.specialization else None,
        )
        self.db.add(d)
        await self.db.flush()
        await self.db.refresh(d)
        return _to_result(d)

    async def update(self, doctor_id: str, data: DoctorUpdate) -> DoctorResult | None:
        r = await self.db.execute(
            select(Doctor).where(
                Doctor.id == doctor_id, Doctor.tenant_id == self.tenant_id
            )
        )
        d = r.scalar_one_or_none()
        if not d:
            return None
        if data.name is not None:
            d.name = data.name.strip()
        if data.specialization is not None:
            d.specialization = data.specialization.strip() or None
        await self.db.flush()
        await self.db.refresh(d)
        return _to_result(d)
