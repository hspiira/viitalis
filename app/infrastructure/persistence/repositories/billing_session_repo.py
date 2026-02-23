"""Billing session repository. Tenant-scoped. CRUD + close workflow."""

from datetime import date
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dtos.billing_session import (
    BillingSessionCreate,
    BillingSessionResult,
    BillingSessionUpdate,
)
from app.infrastructure.persistence.models.billing_session import BillingSession
from app.infrastructure.persistence.models.claim import Claim


def _to_result(s: BillingSession) -> BillingSessionResult:
    return BillingSessionResult(
        id=s.id,
        tenant_id=s.tenant_id,
        name=s.name,
        session_date=s.session_date,
        from_date=s.from_date,
        to_date=s.to_date,
        total_claims=s.total_claims,
        total_amount=Decimal(str(s.total_amount)) if s.total_amount is not None else None,
        status=s.status,
        created_by=s.created_by,
    )


class BillingSessionRepository:
    def __init__(self, db: AsyncSession, tenant_id: str) -> None:
        self.db = db
        self.tenant_id = tenant_id

    async def get_by_id(self, session_id: str) -> BillingSessionResult | None:
        r = await self.db.execute(
            select(BillingSession).where(
                BillingSession.id == session_id,
                BillingSession.tenant_id == self.tenant_id,
            )
        )
        s = r.scalar_one_or_none()
        return _to_result(s) if s else None

    async def list_by_tenant(
        self, skip: int = 0, limit: int = 100, status: str | None = None
    ) -> list[BillingSessionResult]:
        q = select(BillingSession).where(
            BillingSession.tenant_id == self.tenant_id
        )
        if status is not None:
            q = q.where(BillingSession.status == status)
        q = q.offset(skip).limit(limit).order_by(BillingSession.session_date.desc())
        r = await self.db.execute(q)
        return [_to_result(s) for s in r.scalars().all()]

    async def create(self, data: BillingSessionCreate) -> BillingSessionResult:
        s = BillingSession(
            tenant_id=self.tenant_id,
            name=data.name.strip(),
            session_date=data.session_date,
            from_date=data.from_date,
            to_date=data.to_date,
            created_by=data.created_by,
        )
        self.db.add(s)
        await self.db.flush()
        await self.db.refresh(s)
        return _to_result(s)

    async def update(
        self, session_id: str, data: BillingSessionUpdate
    ) -> BillingSessionResult | None:
        r = await self.db.execute(
            select(BillingSession).where(
                BillingSession.id == session_id,
                BillingSession.tenant_id == self.tenant_id,
            )
        )
        s = r.scalar_one_or_none()
        if not s:
            return None
        if data.name is not None:
            s.name = data.name.strip()
        if data.from_date is not None:
            s.from_date = data.from_date
        if data.to_date is not None:
            s.to_date = data.to_date
        if data.status is not None:
            s.status = data.status
        await self.db.flush()
        await self.db.refresh(s)
        return _to_result(s)

    async def close_with_snapshot(
        self,
        session_id: str,
        total_claims: int,
        total_amount: Decimal,
    ) -> BillingSessionResult | None:
        """Set session status to closed and store snapshot totals."""
        r = await self.db.execute(
            select(BillingSession).where(
                BillingSession.id == session_id,
                BillingSession.tenant_id == self.tenant_id,
            )
        )
        s = r.scalar_one_or_none()
        if not s:
            return None
        s.status = "closed"
        s.total_claims = total_claims
        s.total_amount = float(total_amount) if total_amount is not None else None
        await self.db.flush()
        await self.db.refresh(s)
        return _to_result(s)

    async def count_unapproved_claims_in_range(
        self, from_date: date | None, to_date: date | None
    ) -> int:
        """Count claims in tenant with service_date in [from_date, to_date] and approved_at is None."""
        q = select(func.count(Claim.id)).where(
            Claim.tenant_id == self.tenant_id,
            Claim.approved_at.is_(None),
        )
        if from_date is not None:
            q = q.where(Claim.service_date >= from_date)
        if to_date is not None:
            q = q.where(Claim.service_date <= to_date)
        r = await self.db.execute(q)
        return r.scalar_one_or_none() or 0

    async def snapshot_totals_in_range(
        self, from_date: date | None, to_date: date | None
    ) -> tuple[int, Decimal]:
        """Return (count, total_amount) of claims in tenant with service_date in range."""
        q = select(
            func.count(Claim.id).label("cnt"),
            func.coalesce(func.sum(Claim.total_amount), 0).label("total"),
        ).where(Claim.tenant_id == self.tenant_id)
        if from_date is not None:
            q = q.where(Claim.service_date >= from_date)
        if to_date is not None:
            q = q.where(Claim.service_date <= to_date)
        r = await self.db.execute(q)
        row = r.one_or_none()
        if not row:
            return 0, Decimal("0")
        return row[0] or 0, Decimal(str(row[1])) if row[1] is not None else Decimal("0")
