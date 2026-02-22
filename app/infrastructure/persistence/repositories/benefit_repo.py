"""Benefit repository. Tenant-scoped CRUD."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dtos.benefit import BenefitCreate, BenefitResult, BenefitUpdate
from app.infrastructure.persistence.models.benefit import Benefit


def _to_result(b: Benefit) -> BenefitResult:
    return BenefitResult(
        id=b.id,
        tenant_id=b.tenant_id,
        name=b.name,
        code=b.code,
        service_name=b.service_name,
        in_or_out_patient=b.in_or_out_patient,
        limit_amount=b.limit_amount,
        scheme_duration=b.scheme_duration,
        covered=b.covered,
        status=b.status,
        remarks=b.remarks,
    )


class BenefitRepository:
    def __init__(self, db: AsyncSession, tenant_id: str) -> None:
        self.db = db
        self.tenant_id = tenant_id

    async def get_by_id(self, benefit_id: str) -> BenefitResult | None:
        r = await self.db.execute(
            select(Benefit).where(
                Benefit.id == benefit_id,
                Benefit.tenant_id == self.tenant_id,
            )
        )
        b = r.scalar_one_or_none()
        return _to_result(b) if b else None

    async def get_by_code(self, code: str) -> BenefitResult | None:
        """Return benefit by code (within tenant)."""
        if not code or not str(code).strip():
            return None
        r = await self.db.execute(
            select(Benefit).where(
                Benefit.tenant_id == self.tenant_id,
                Benefit.code == str(code).strip(),
            )
        )
        b = r.scalar_one_or_none()
        return _to_result(b) if b else None

    async def list_by_tenant(
        self, skip: int = 0, limit: int = 100, status: str | None = None
    ) -> list[BenefitResult]:
        q = select(Benefit).where(Benefit.tenant_id == self.tenant_id)
        if status is not None:
            q = q.where(Benefit.status == status)
        q = q.offset(skip).limit(limit).order_by(Benefit.name)
        r = await self.db.execute(q)
        return [_to_result(b) for b in r.scalars().all()]

    async def create(self, data: BenefitCreate) -> BenefitResult:
        b = Benefit(
            tenant_id=self.tenant_id,
            name=data.name.strip(),
            code=data.code.strip() if data.code else None,
            service_name=data.service_name.strip() if data.service_name else None,
            in_or_out_patient=data.in_or_out_patient,
            limit_amount=data.limit_amount,
            scheme_duration=data.scheme_duration,
            covered=data.covered,
            status=data.status,
            remarks=data.remarks.strip() if data.remarks else None,
        )
        self.db.add(b)
        await self.db.flush()
        await self.db.refresh(b)
        return _to_result(b)

    async def update(
        self, benefit_id: str, data: BenefitUpdate
    ) -> BenefitResult | None:
        r = await self.db.execute(
            select(Benefit).where(
                Benefit.id == benefit_id,
                Benefit.tenant_id == self.tenant_id,
            )
        )
        b = r.scalar_one_or_none()
        if not b:
            return None
        if data.name is not None:
            b.name = data.name.strip()
        if data.code is not None:
            b.code = data.code.strip() or None
        if data.service_name is not None:
            b.service_name = data.service_name.strip() or None
        if data.in_or_out_patient is not None:
            b.in_or_out_patient = data.in_or_out_patient
        if data.limit_amount is not None:
            b.limit_amount = data.limit_amount
        if data.scheme_duration is not None:
            b.scheme_duration = data.scheme_duration
        if data.covered is not None:
            b.covered = data.covered
        if data.status is not None:
            b.status = data.status
        if data.remarks is not None:
            b.remarks = data.remarks.strip() or None
        await self.db.flush()
        await self.db.refresh(b)
        return _to_result(b)
