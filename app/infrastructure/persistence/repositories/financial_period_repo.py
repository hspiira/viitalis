"""Financial period repository. Tenant-scoped CRUD."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dtos.reference_data import (
    FinancialPeriodCreate,
    FinancialPeriodResult,
    FinancialPeriodUpdate,
)
from app.infrastructure.persistence.models.financial_period import FinancialPeriod


def _to_result(f: FinancialPeriod) -> FinancialPeriodResult:
    return FinancialPeriodResult(
        id=f.id,
        tenant_id=f.tenant_id,
        name=f.name,
        start_date=f.start_date,
        end_date=f.end_date,
        is_current=f.is_current,
        status=f.status,
    )


class FinancialPeriodRepository:
    def __init__(self, db: AsyncSession, tenant_id: str) -> None:
        self.db = db
        self.tenant_id = tenant_id

    async def get_by_id(self, entity_id: str) -> FinancialPeriodResult | None:
        r = await self.db.execute(
            select(FinancialPeriod).where(
                FinancialPeriod.id == entity_id,
                FinancialPeriod.tenant_id == self.tenant_id,
            )
        )
        f = r.scalar_one_or_none()
        return _to_result(f) if f else None

    async def list_by_tenant(
        self, skip: int = 0, limit: int = 100, status: str | None = None
    ) -> list[FinancialPeriodResult]:
        q = select(FinancialPeriod).where(
            FinancialPeriod.tenant_id == self.tenant_id
        )
        if status is not None:
            q = q.where(FinancialPeriod.status == status)
        q = q.offset(skip).limit(limit).order_by(FinancialPeriod.start_date.desc())
        r = await self.db.execute(q)
        return [_to_result(f) for f in r.scalars().all()]

    async def create(self, data: FinancialPeriodCreate) -> FinancialPeriodResult:
        f = FinancialPeriod(
            tenant_id=self.tenant_id,
            name=data.name.strip(),
            start_date=data.start_date,
            end_date=data.end_date,
            is_current=data.is_current,
            status=data.status,
        )
        self.db.add(f)
        await self.db.flush()
        await self.db.refresh(f)
        return _to_result(f)

    async def update(
        self, entity_id: str, data: FinancialPeriodUpdate
    ) -> FinancialPeriodResult | None:
        r = await self.db.execute(
            select(FinancialPeriod).where(
                FinancialPeriod.id == entity_id,
                FinancialPeriod.tenant_id == self.tenant_id,
            )
        )
        f = r.scalar_one_or_none()
        if not f:
            return None
        if data.name is not None:
            f.name = data.name.strip()
        if data.start_date is not None:
            f.start_date = data.start_date
        if data.end_date is not None:
            f.end_date = data.end_date
        if data.is_current is not None:
            f.is_current = data.is_current
        if data.status is not None:
            f.status = data.status
        await self.db.flush()
        await self.db.refresh(f)
        return _to_result(f)
