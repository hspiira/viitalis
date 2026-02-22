"""Hospital repository. Tenant-scoped. Full parity with Hospitals.csv."""

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dtos.hospital import HospitalCreate, HospitalResult, HospitalUpdate
from app.infrastructure.persistence.models.claim import Claim
from app.infrastructure.persistence.models.hospital import Hospital


def _to_result(h: Hospital) -> HospitalResult:
    return HospitalResult(
        id=h.id,
        tenant_id=h.tenant_id,
        name=h.name,
        address=h.address,
        code=h.code,
        reference=h.reference,
        contact_person=h.contact_person,
        phone=h.phone,
        email=h.email,
        website=h.website,
        remarks=h.remarks,
        district_id=h.district_id,
        outpatient_capacity=h.outpatient_capacity,
        inpatient_capacity=h.inpatient_capacity,
        out_or_in_patient=h.out_or_in_patient,
        dental=h.dental,
        status=h.status,
    )


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

    def _apply_create(self, h: Hospital, data: HospitalCreate) -> None:
        h.name = data.name.strip()
        h.address = data.address.strip() if data.address else None
        h.code = data.code.strip() if data.code else None
        h.reference = data.reference.strip() if data.reference else None
        h.contact_person = data.contact_person.strip() if data.contact_person else None
        h.phone = data.phone.strip() if data.phone else None
        h.email = data.email.strip() if data.email else None
        h.website = data.website.strip() if data.website else None
        h.remarks = data.remarks.strip() if data.remarks else None
        h.district_id = data.district_id
        h.outpatient_capacity = data.outpatient_capacity
        h.inpatient_capacity = data.inpatient_capacity
        h.out_or_in_patient = data.out_or_in_patient.strip() if data.out_or_in_patient else None
        h.dental = data.dental
        h.status = data.status or "active"

    async def create(self, data: HospitalCreate) -> HospitalResult:
        h = Hospital(tenant_id=self.tenant_id)
        self._apply_create(h, data)
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
        if data.code is not None:
            h.code = data.code.strip() or None
        if data.reference is not None:
            h.reference = data.reference.strip() or None
        if data.contact_person is not None:
            h.contact_person = data.contact_person.strip() or None
        if data.phone is not None:
            h.phone = data.phone.strip() or None
        if data.email is not None:
            h.email = data.email.strip() or None
        if data.website is not None:
            h.website = data.website.strip() or None
        if data.remarks is not None:
            h.remarks = data.remarks.strip() or None
        if data.district_id is not None:
            h.district_id = data.district_id
        if data.outpatient_capacity is not None:
            h.outpatient_capacity = data.outpatient_capacity
        if data.inpatient_capacity is not None:
            h.inpatient_capacity = data.inpatient_capacity
        if data.out_or_in_patient is not None:
            h.out_or_in_patient = data.out_or_in_patient.strip() or None
        if data.dental is not None:
            h.dental = data.dental
        if data.status is not None:
            h.status = data.status.strip() or "active"
        await self.db.flush()
        await self.db.refresh(h)
        return _to_result(h)

    async def has_claims(self, hospital_id: str) -> bool:
        """True if any claim in this tenant references this hospital."""
        r = await self.db.execute(
            select(Claim.id).where(
                Claim.tenant_id == self.tenant_id,
                Claim.hospital_id == hospital_id,
            ).limit(1)
        )
        return r.scalar_one_or_none() is not None

    async def delete(self, hospital_id: str) -> bool:
        """Delete hospital by ID. Returns True if found and deleted."""
        result = await self.db.execute(
            delete(Hospital).where(
                Hospital.id == hospital_id,
                Hospital.tenant_id == self.tenant_id,
            )
        )
        return result.rowcount > 0
