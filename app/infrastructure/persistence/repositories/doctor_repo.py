"""Doctor repository. Tenant-scoped. Full parity with Doctors.csv."""

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
        reference=d.reference,
        date_of_birth=d.date_of_birth,
        address=d.address,
        phone_home=d.phone_home,
        phone_mobile=d.phone_mobile,
        licence_no=d.licence_no,
        department=d.department,
        doctor_category=d.doctor_category,
        email=d.email,
        website=d.website,
        gender=d.gender,
        remarks=d.remarks,
        service_charges=float(d.service_charges) if d.service_charges is not None else None,
        channeling_charges=float(d.channeling_charges) if d.channeling_charges is not None else None,
        referring_charges=float(d.referring_charges) if d.referring_charges is not None else None,
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

    def _apply_create(self, d: Doctor, data: DoctorCreate) -> None:
        d.hospital_id = data.hospital_id
        d.name = data.name.strip()
        d.specialization = data.specialization.strip() if data.specialization else None
        d.reference = data.reference.strip() if data.reference else None
        d.date_of_birth = data.date_of_birth
        d.address = data.address.strip() if data.address else None
        d.phone_home = data.phone_home.strip() if data.phone_home else None
        d.phone_mobile = data.phone_mobile.strip() if data.phone_mobile else None
        d.licence_no = data.licence_no.strip() if data.licence_no else None
        d.department = data.department.strip() if data.department else None
        d.doctor_category = data.doctor_category.strip() if data.doctor_category else None
        d.email = data.email.strip() if data.email else None
        d.website = data.website.strip() if data.website else None
        d.gender = data.gender.strip() if data.gender else None
        d.remarks = data.remarks.strip() if data.remarks else None
        d.service_charges = data.service_charges
        d.channeling_charges = data.channeling_charges
        d.referring_charges = data.referring_charges

    async def create(self, data: DoctorCreate) -> DoctorResult:
        d = Doctor(tenant_id=self.tenant_id)
        self._apply_create(d, data)
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
        # Optional fields: allow None to clear; strip strings
        def _str(v: str | None) -> str | None:
            return (v.strip() or None) if isinstance(v, str) else v

        d.reference = _str(data.reference)
        d.date_of_birth = data.date_of_birth
        d.address = _str(data.address)
        d.phone_home = _str(data.phone_home)
        d.phone_mobile = _str(data.phone_mobile)
        d.licence_no = _str(data.licence_no)
        d.department = _str(data.department)
        d.doctor_category = _str(data.doctor_category)
        d.email = _str(data.email)
        d.website = _str(data.website)
        d.gender = _str(data.gender)
        d.remarks = _str(data.remarks)
        d.service_charges = data.service_charges
        d.channeling_charges = data.channeling_charges
        d.referring_charges = data.referring_charges
        await self.db.flush()
        await self.db.refresh(d)
        return _to_result(d)
