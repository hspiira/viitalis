"""Claim repository. Tenant-scoped. Creates claim + details in one transaction."""

from datetime import date, datetime, timezone
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dtos.claim import (
    ClaimCreate,
    ClaimDetailCreate,
    ClaimDetailResult,
    ClaimResult,
    ClaimUpdate,
)
from app.infrastructure.persistence.models.claim import Claim
from app.infrastructure.persistence.models.claim_detail import ClaimDetail


def _claim_to_result(c: Claim) -> ClaimResult:
    return ClaimResult(
        id=c.id,
        tenant_id=c.tenant_id,
        member_id=c.member_id,
        dependant_id=c.dependant_id,
        hospital_id=c.hospital_id,
        doctor_id=c.doctor_id,
        service_date=c.service_date,
        total_amount=c.total_amount,
        status=c.status,
        invoice_number=c.invoice_number,
        approved_at=c.approved_at,
        approved_by=c.approved_by,
        approval_comments=c.approval_comments,
        billing_session_id=c.billing_session_id,
    )


def _detail_to_result(d: ClaimDetail) -> ClaimDetailResult:
    return ClaimDetailResult(
        id=d.id,
        tenant_id=d.tenant_id,
        claim_id=d.claim_id,
        fee_code=d.fee_code,
        description=d.description,
        unit_price=d.unit_price,
        qty=d.qty,
        amount=d.amount,
        status=d.status,
    )


class ClaimRepository:
    def __init__(self, db: AsyncSession, tenant_id: str) -> None:
        self.db = db
        self.tenant_id = tenant_id

    async def exists_by_invoice_and_hospital(
        self, invoice_number: str, hospital_id: str
    ) -> bool:
        """True if a claim already exists for this tenant with same invoice_number and hospital_id."""
        if not invoice_number or not invoice_number.strip():
            return False
        r = await self.db.execute(
            select(Claim.id).where(
                Claim.tenant_id == self.tenant_id,
                Claim.invoice_number == invoice_number.strip(),
                Claim.hospital_id == hospital_id,
            ).limit(1)
        )
        return r.scalar_one_or_none() is not None

    async def exists_by_dependant_id(self, dependant_id: str) -> bool:
        """True if any claim in this tenant references this dependant_id."""
        r = await self.db.execute(
            select(Claim.id).where(
                Claim.tenant_id == self.tenant_id,
                Claim.dependant_id == dependant_id,
            ).limit(1)
        )
        return r.scalar_one_or_none() is not None

    async def get_by_id(self, claim_id: str) -> ClaimResult | None:
        r = await self.db.execute(
            select(Claim).where(
                Claim.id == claim_id, Claim.tenant_id == self.tenant_id
            )
        )
        c = r.scalar_one_or_none()
        return _claim_to_result(c) if c else None

    async def list_by_tenant(
        self,
        skip: int = 0,
        limit: int = 100,
        member_id: str | None = None,
        status: str | None = None,
        hospital_id: str | None = None,
        service_date_from: date | None = None,
        service_date_to: date | None = None,
    ) -> list[ClaimResult]:
        q = select(Claim).where(Claim.tenant_id == self.tenant_id)
        if member_id is not None:
            q = q.where(Claim.member_id == member_id)
        if status is not None:
            q = q.where(Claim.status == status)
        if hospital_id is not None:
            q = q.where(Claim.hospital_id == hospital_id)
        if service_date_from is not None:
            q = q.where(Claim.service_date >= service_date_from)
        if service_date_to is not None:
            q = q.where(Claim.service_date <= service_date_to)
        q = q.offset(skip).limit(limit).order_by(Claim.service_date.desc())
        r = await self.db.execute(q)
        return [_claim_to_result(c) for c in r.scalars().all()]

    async def create_with_details(
        self, data: ClaimCreate, details: list[ClaimDetailCreate]
    ) -> ClaimResult:
        total = sum((d.amount for d in details), Decimal("0"))
        claim = Claim(
            tenant_id=self.tenant_id,
            member_id=data.member_id,
            dependant_id=data.dependant_id,
            hospital_id=data.hospital_id,
            doctor_id=data.doctor_id,
            service_date=data.service_date,
            total_amount=total if data.total_amount is None else data.total_amount,
            status=data.status,
            invoice_number=data.invoice_number,
            billing_session_id=data.billing_session_id,
        )
        self.db.add(claim)
        await self.db.flush()
        for d in details:
            detail = ClaimDetail(
                tenant_id=self.tenant_id,
                claim_id=claim.id,
                fee_code=d.fee_code,
                description=d.description,
                unit_price=d.unit_price,
                qty=d.qty,
                amount=d.amount,
                status=d.status,
            )
            self.db.add(detail)
        await self.db.flush()
        await self.db.refresh(claim)
        return _claim_to_result(claim)

    async def update(self, claim_id: str, data: ClaimUpdate) -> ClaimResult | None:
        r = await self.db.execute(
            select(Claim).where(
                Claim.id == claim_id, Claim.tenant_id == self.tenant_id
            )
        )
        c = r.scalar_one_or_none()
        if not c:
            return None
        if data.service_date is not None:
            c.service_date = data.service_date
        if data.total_amount is not None:
            c.total_amount = data.total_amount
        if data.status is not None:
            c.status = data.status
        if data.invoice_number is not None:
            c.invoice_number = data.invoice_number
        await self.db.flush()
        await self.db.refresh(c)
        return _claim_to_result(c)

    async def list_details(self, claim_id: str) -> list[ClaimDetailResult]:
        r = await self.db.execute(
            select(ClaimDetail).where(
                ClaimDetail.tenant_id == self.tenant_id,
                ClaimDetail.claim_id == claim_id,
            ).order_by(ClaimDetail.id)
        )
        return [_detail_to_result(d) for d in r.scalars().all()]

    async def update_approval(
        self,
        claim_id: str,
        approved: bool,
        approved_by: str | None = None,
        comments: str | None = None,
    ) -> ClaimResult | None:
        c = await self.get_by_id(claim_id)
        if not c:
            return None
        r = await self.db.execute(
            select(Claim).where(
                Claim.id == claim_id, Claim.tenant_id == self.tenant_id
            )
        )
        claim = r.scalar_one_or_none()
        if not claim:
            return None
        if approved:
            claim.approved_at = datetime.now(timezone.utc)
            claim.approved_by = approved_by
            claim.status = "approved"
        else:
            claim.approved_at = None
            claim.approved_by = None
            claim.status = "rejected"
        claim.approval_comments = comments
        await self.db.flush()
        await self.db.refresh(claim)
        return _claim_to_result(claim)

    async def bulk_approve(
        self,
        claim_ids: list[str],
        approved: bool,
        approved_by: str | None = None,
        comments: str | None = None,
    ) -> int:
        count = 0
        for claim_id in claim_ids:
            updated = await self.update_approval(
                claim_id, approved=approved, approved_by=approved_by, comments=comments
            )
            if updated:
                count += 1
        return count
