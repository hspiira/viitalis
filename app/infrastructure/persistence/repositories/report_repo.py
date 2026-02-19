"""Read-only report repository. Aggregate queries for reporting."""

from datetime import date
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dtos.reports.report_dtos import (
    ClaimAnalysisSummary,
    CompanySummaryResult,
    HospitalSummaryResult,
    UtilisationByMemberResult,
)
from app.infrastructure.persistence.models.claim import Claim
from app.infrastructure.persistence.models.company import Company
from app.infrastructure.persistence.models.hospital import Hospital
from app.infrastructure.persistence.models.member import Member


class ReportRepository:
    def __init__(self, db: AsyncSession, tenant_id: str) -> None:
        self.db = db
        self.tenant_id = tenant_id

    async def company_summary(
        self,
        company_id: str | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
        skip: int = 0,
        limit: int = 200,
    ) -> list[CompanySummaryResult]:
        """Aggregate per company: member count, claim count, total amount (optional date filter on claims)."""
        # Subquery for claim stats per company (via member.company_id)
        claim_subq = (
            select(
                Member.company_id,
                func.count(Claim.id).label("claim_count"),
                func.coalesce(func.sum(Claim.total_amount), 0).label("total_amount"),
            )
            .select_from(Claim)
            .join(Member, Claim.member_id == Member.id)
            .where(
                Claim.tenant_id == self.tenant_id,
                Member.tenant_id == self.tenant_id,
                Member.deleted_at.is_(None),
            )
        )
        if date_from is not None:
            claim_subq = claim_subq.where(Claim.service_date >= date_from)
        if date_to is not None:
            claim_subq = claim_subq.where(Claim.service_date <= date_to)
        claim_subq = claim_subq.group_by(Member.company_id).subquery()

        member_count_subq = (
            select(Member.company_id, func.count(Member.id).label("member_count"))
            .where(
                Member.tenant_id == self.tenant_id,
                Member.deleted_at.is_(None),
            )
            .group_by(Member.company_id)
            .subquery()
        )

        q = (
            select(
                Company.id,
                Company.name,
                func.coalesce(member_count_subq.c.member_count, 0).label("member_count"),
                func.coalesce(claim_subq.c.claim_count, 0).label("claim_count"),
                claim_subq.c.total_amount,
            )
            .select_from(Company)
            .outerjoin(
                member_count_subq,
                Company.id == member_count_subq.c.company_id,
            )
            .outerjoin(claim_subq, Company.id == claim_subq.c.company_id)
            .where(Company.tenant_id == self.tenant_id)
        )
        if company_id is not None:
            q = q.where(Company.id == company_id)
        q = q.offset(skip).limit(limit).order_by(Company.name)
        r = await self.db.execute(q)
        rows = r.all()
        return [
            CompanySummaryResult(
                company_id=row.id,
                company_name=row.name,
                member_count=int(row.member_count or 0),
                claim_count=int(row.claim_count or 0),
                total_amount=Decimal(str(row.total_amount)) if row.total_amount is not None else None,
            )
            for row in rows
        ]

    async def claim_analysis(
        self,
        date_from: date | None = None,
        date_to: date | None = None,
    ) -> list[ClaimAnalysisSummary]:
        """Claim counts and total amount by status (optional date filter)."""
        q = (
            select(
                Claim.status,
                func.count(Claim.id).label("count"),
                func.sum(Claim.total_amount).label("total_amount"),
            )
            .where(Claim.tenant_id == self.tenant_id)
        )
        if date_from is not None:
            q = q.where(Claim.service_date >= date_from)
        if date_to is not None:
            q = q.where(Claim.service_date <= date_to)
        q = q.group_by(Claim.status)
        r = await self.db.execute(q)
        return [
            ClaimAnalysisSummary(
                status=row.status,
                count=int(row.count or 0),
                total_amount=Decimal(str(row.total_amount)) if row.total_amount is not None else None,
            )
            for row in r.all()
        ]

    async def utilisation_by_member(
        self,
        company_id: str | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
        skip: int = 0,
        limit: int = 100,
    ) -> list[UtilisationByMemberResult]:
        """Claims and total amount per member (optional company and date filter)."""
        join_cond = (Claim.member_id == Member.id) & (Claim.tenant_id == self.tenant_id)
        if date_from is not None:
            join_cond = join_cond & (Claim.service_date >= date_from)
        if date_to is not None:
            join_cond = join_cond & (Claim.service_date <= date_to)
        q = (
            select(
                Member.id,
                Member.name,
                Member.card_no,
                func.count(Claim.id).label("claim_count"),
                func.sum(Claim.total_amount).label("total_amount"),
            )
            .select_from(Member)
            .outerjoin(Claim, join_cond)
            .where(
                Member.tenant_id == self.tenant_id,
                Member.deleted_at.is_(None),
            )
        )
        if company_id is not None:
            q = q.where(Member.company_id == company_id)
        q = q.group_by(Member.id, Member.name, Member.card_no)
        q = q.offset(skip).limit(limit).order_by(func.count(Claim.id).desc())
        r = await self.db.execute(q)
        return [
            UtilisationByMemberResult(
                member_id=row.id,
                member_name=row.name,
                card_no=row.card_no,
                claim_count=int(row.claim_count or 0),
                total_amount=Decimal(str(row.total_amount)) if row.total_amount is not None else None,
            )
            for row in r.all()
        ]

    async def hospital_summary(
        self,
        date_from: date | None = None,
        date_to: date | None = None,
        skip: int = 0,
        limit: int = 100,
    ) -> list[HospitalSummaryResult]:
        """Claim counts and total amount per hospital (optional date filter)."""
        join_cond = (Claim.hospital_id == Hospital.id) & (Claim.tenant_id == self.tenant_id)
        if date_from is not None:
            join_cond = join_cond & (Claim.service_date >= date_from)
        if date_to is not None:
            join_cond = join_cond & (Claim.service_date <= date_to)
        q = (
            select(
                Hospital.id,
                Hospital.name,
                func.count(Claim.id).label("claim_count"),
                func.sum(Claim.total_amount).label("total_amount"),
            )
            .select_from(Hospital)
            .outerjoin(Claim, join_cond)
            .where(Hospital.tenant_id == self.tenant_id)
        )
        q = q.group_by(Hospital.id, Hospital.name)
        q = q.offset(skip).limit(limit).order_by(func.count(Claim.id).desc())
        r = await self.db.execute(q)
        return [
            HospitalSummaryResult(
                hospital_id=row.id,
                hospital_name=row.name,
                claim_count=int(row.claim_count or 0),
                total_amount=Decimal(str(row.total_amount)) if row.total_amount is not None else None,
            )
            for row in r.all()
        ]
