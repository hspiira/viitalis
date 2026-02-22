"""Hospital branch repository. Tenant-scoped. Full parity with Hospital Branches.csv."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dtos.hospital import (
    HospitalBranchCreate,
    HospitalBranchResult,
    HospitalBranchUpdate,
)
from app.infrastructure.persistence.models.hospital_branch import HospitalBranch


def _to_result(b: HospitalBranch) -> HospitalBranchResult:
    return HospitalBranchResult(
        id=b.id,
        tenant_id=b.tenant_id,
        hospital_id=b.hospital_id,
        name=b.name,
        address=b.address,
        contact_person=b.contact_person,
        location=b.location,
        remarks=b.remarks,
    )


class HospitalBranchRepository:
    def __init__(self, db: AsyncSession, tenant_id: str) -> None:
        self.db = db
        self.tenant_id = tenant_id

    async def get_by_id(self, branch_id: str) -> HospitalBranchResult | None:
        r = await self.db.execute(
            select(HospitalBranch).where(
                HospitalBranch.id == branch_id,
                HospitalBranch.tenant_id == self.tenant_id,
            )
        )
        b = r.scalar_one_or_none()
        return _to_result(b) if b else None

    async def list_by_hospital(
        self, hospital_id: str, skip: int = 0, limit: int = 100
    ) -> list[HospitalBranchResult]:
        r = await self.db.execute(
            select(HospitalBranch)
            .where(
                HospitalBranch.tenant_id == self.tenant_id,
                HospitalBranch.hospital_id == hospital_id,
            )
            .offset(skip)
            .limit(limit)
            .order_by(HospitalBranch.name)
        )
        return [_to_result(b) for b in r.scalars().all()]

    async def create(self, data: HospitalBranchCreate) -> HospitalBranchResult:
        b = HospitalBranch(
            tenant_id=self.tenant_id,
            hospital_id=data.hospital_id,
            name=data.name.strip(),
            address=data.address.strip() if data.address else None,
            contact_person=data.contact_person.strip() if data.contact_person else None,
            location=data.location.strip() if data.location else None,
            remarks=data.remarks.strip() if data.remarks else None,
        )
        self.db.add(b)
        await self.db.flush()
        await self.db.refresh(b)
        return _to_result(b)

    async def update(
        self, branch_id: str, data: HospitalBranchUpdate
    ) -> HospitalBranchResult | None:
        r = await self.db.execute(
            select(HospitalBranch).where(
                HospitalBranch.id == branch_id,
                HospitalBranch.tenant_id == self.tenant_id,
            )
        )
        b = r.scalar_one_or_none()
        if not b:
            return None
        if data.name is not None:
            b.name = data.name.strip()
        if data.address is not None:
            b.address = data.address.strip() or None
        if data.contact_person is not None:
            b.contact_person = data.contact_person.strip() or None
        if data.location is not None:
            b.location = data.location.strip() or None
        if data.remarks is not None:
            b.remarks = data.remarks.strip() or None
        await self.db.flush()
        await self.db.refresh(b)
        return _to_result(b)
