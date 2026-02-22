"""Scheme repository. Tenant-scoped: all queries filter by tenant_id."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dtos.benefit import SchemeBenefitCreate, SchemeBenefitResult, SchemeBenefitUpdate
from app.application.dtos.scheme import (
    SchemeCreate,
    SchemePlanCreate,
    SchemePlanResult,
    SchemeResult,
    SchemeUpdate,
)
from app.infrastructure.persistence.models.scheme import Scheme
from app.infrastructure.persistence.models.scheme_benefit import SchemeBenefit
from app.infrastructure.persistence.models.scheme_plan import SchemePlan


def _scheme_to_result(s: Scheme) -> SchemeResult:
    """Map ORM Scheme to SchemeResult."""
    return SchemeResult(
        id=s.id,
        tenant_id=s.tenant_id,
        company_id=s.company_id,
        code=s.code,
        name=s.name,
        description=s.description,
        limit_value=s.limit_value,
        begin_date=s.begin_date,
        end_date=s.end_date,
        termination_date=s.termination_date,
        status=s.status,
    )


class SchemeRepository:
    """Scheme repository. All access scoped to tenant_id."""

    def __init__(self, db: AsyncSession, tenant_id: str) -> None:
        self.db = db
        self.tenant_id = tenant_id

    async def get_by_id(self, scheme_id: str) -> SchemeResult | None:
        """Return scheme by ID (within tenant)."""
        result = await self.db.execute(
            select(Scheme).where(
                Scheme.id == scheme_id,
                Scheme.tenant_id == self.tenant_id,
            )
        )
        scheme = result.scalar_one_or_none()
        return _scheme_to_result(scheme) if scheme else None

    async def list_by_tenant(
        self,
        skip: int = 0,
        limit: int = 100,
        company_id: str | None = None,
    ) -> list[SchemeResult]:
        """Return schemes for the tenant (optionally by company_id) with pagination."""
        q = select(Scheme).where(Scheme.tenant_id == self.tenant_id)
        if company_id is not None:
            q = q.where(Scheme.company_id == company_id)
        q = q.offset(skip).limit(limit).order_by(Scheme.name)
        result = await self.db.execute(q)
        schemes = result.scalars().all()
        return [_scheme_to_result(s) for s in schemes]

    async def list_by_code(self, code: str) -> list[SchemeResult]:
        """Return all schemes with the given legacy/reference code (e.g. renewals)."""
        result = await self.db.execute(
            select(Scheme)
            .where(
                Scheme.tenant_id == self.tenant_id,
                Scheme.code == code,
            )
            .order_by(Scheme.begin_date.desc().nullslast())
        )
        return [_scheme_to_result(s) for s in result.scalars().all()]

    async def create(self, data: SchemeCreate) -> SchemeResult:
        """Create a scheme (tenant_id from repo scope)."""
        scheme = Scheme(
            tenant_id=self.tenant_id,
            company_id=data.company_id,
            code=data.code.strip() if data.code else None,
            name=data.name.strip(),
            description=data.description.strip() if data.description else None,
            limit_value=data.limit_value,
            begin_date=data.begin_date,
            end_date=data.end_date,
            termination_date=data.termination_date,
            status=data.status,
        )
        self.db.add(scheme)
        await self.db.flush()
        await self.db.refresh(scheme)
        return _scheme_to_result(scheme)

    async def update(
        self, scheme_id: str, data: SchemeUpdate
    ) -> SchemeResult | None:
        """Update a scheme. Returns updated scheme or None if not found."""
        result = await self.db.execute(
            select(Scheme).where(
                Scheme.id == scheme_id,
                Scheme.tenant_id == self.tenant_id,
            )
        )
        scheme = result.scalar_one_or_none()
        if not scheme:
            return None
        if data.name is not None:
            scheme.name = data.name.strip()
        if data.code is not None:
            scheme.code = data.code.strip() or None
        if data.description is not None:
            scheme.description = data.description.strip() or None
        if data.limit_value is not None:
            scheme.limit_value = data.limit_value
        if data.begin_date is not None:
            scheme.begin_date = data.begin_date
        if data.end_date is not None:
            scheme.end_date = data.end_date
        if data.termination_date is not None:
            scheme.termination_date = data.termination_date
        if data.status is not None:
            scheme.status = data.status
        await self.db.flush()
        await self.db.refresh(scheme)
        return _scheme_to_result(scheme)

    async def exists_scheme_plan(self, scheme_id: str, plan_id: str) -> bool:
        """True if this (scheme_id, plan_id) link already exists for this tenant."""
        r = await self.db.execute(
            select(SchemePlan.id).where(
                SchemePlan.tenant_id == self.tenant_id,
                SchemePlan.scheme_id == scheme_id,
                SchemePlan.plan_id == plan_id,
            ).limit(1)
        )
        return r.scalar_one_or_none() is not None

    async def add_scheme_plan(
        self, data: SchemePlanCreate
    ) -> SchemePlanResult:
        """Link a plan to a scheme (optionally with limit and dates). Returns the created scheme_plan."""
        sp = SchemePlan(
            tenant_id=self.tenant_id,
            scheme_id=data.scheme_id,
            plan_id=data.plan_id,
            limit_amount=data.limit_amount,
            begin_date=data.begin_date,
            end_date=data.end_date,
            status=data.status,
        )
        self.db.add(sp)
        await self.db.flush()
        await self.db.refresh(sp)
        return SchemePlanResult(
            id=sp.id,
            tenant_id=sp.tenant_id,
            scheme_id=sp.scheme_id,
            plan_id=sp.plan_id,
            limit_amount=sp.limit_amount,
            begin_date=sp.begin_date,
            end_date=sp.end_date,
            status=sp.status,
        )

    async def list_scheme_benefits(
        self, scheme_id: str, skip: int = 0, limit: int = 100
    ) -> list[SchemeBenefitResult]:
        r = await self.db.execute(
            select(SchemeBenefit)
            .where(
                SchemeBenefit.tenant_id == self.tenant_id,
                SchemeBenefit.scheme_id == scheme_id,
            )
            .offset(skip)
            .limit(limit)
            .order_by(SchemeBenefit.benefit_id)
        )
        return [
            SchemeBenefitResult(
                id=sb.id,
                tenant_id=sb.tenant_id,
                scheme_id=sb.scheme_id,
                benefit_id=sb.benefit_id,
                limit_amount=sb.limit_amount,
                copayment_percent=sb.copayment_percent,
                waiting_period_days=sb.waiting_period_days,
                status=sb.status,
                termination_date=sb.termination_date,
            )
            for sb in r.scalars().all()
        ]

    async def exists_scheme_benefit(self, scheme_id: str, benefit_id: str) -> bool:
        r = await self.db.execute(
            select(SchemeBenefit.id).where(
                SchemeBenefit.tenant_id == self.tenant_id,
                SchemeBenefit.scheme_id == scheme_id,
                SchemeBenefit.benefit_id == benefit_id,
            ).limit(1)
        )
        return r.scalar_one_or_none() is not None

    async def add_scheme_benefit(
        self, scheme_id: str, data: SchemeBenefitCreate
    ) -> SchemeBenefitResult:
        sb = SchemeBenefit(
            tenant_id=self.tenant_id,
            scheme_id=scheme_id,
            benefit_id=data.benefit_id,
            limit_amount=data.limit_amount,
            copayment_percent=data.copayment_percent,
            waiting_period_days=data.waiting_period_days,
            status=data.status,
        )
        self.db.add(sb)
        await self.db.flush()
        await self.db.refresh(sb)
        return SchemeBenefitResult(
            id=sb.id,
            tenant_id=sb.tenant_id,
            scheme_id=sb.scheme_id,
            benefit_id=sb.benefit_id,
            limit_amount=sb.limit_amount,
            copayment_percent=sb.copayment_percent,
            waiting_period_days=sb.waiting_period_days,
            status=sb.status,
            termination_date=sb.termination_date,
        )

    async def get_scheme_benefit_by_id(
        self, scheme_benefit_id: str
    ) -> SchemeBenefitResult | None:
        r = await self.db.execute(
            select(SchemeBenefit).where(
                SchemeBenefit.id == scheme_benefit_id,
                SchemeBenefit.tenant_id == self.tenant_id,
            )
        )
        sb = r.scalar_one_or_none()
        if not sb:
            return None
        return SchemeBenefitResult(
            id=sb.id,
            tenant_id=sb.tenant_id,
            scheme_id=sb.scheme_id,
            benefit_id=sb.benefit_id,
            limit_amount=sb.limit_amount,
            copayment_percent=sb.copayment_percent,
            waiting_period_days=sb.waiting_period_days,
            status=sb.status,
            termination_date=sb.termination_date,
        )

    async def update_scheme_benefit(
        self, scheme_benefit_id: str, data: SchemeBenefitUpdate
    ) -> SchemeBenefitResult | None:
        r = await self.db.execute(
            select(SchemeBenefit).where(
                SchemeBenefit.id == scheme_benefit_id,
                SchemeBenefit.tenant_id == self.tenant_id,
            )
        )
        sb = r.scalar_one_or_none()
        if not sb:
            return None
        if data.limit_amount is not None:
            sb.limit_amount = data.limit_amount
        if data.copayment_percent is not None:
            sb.copayment_percent = data.copayment_percent
        if data.waiting_period_days is not None:
            sb.waiting_period_days = data.waiting_period_days
        if data.status is not None:
            sb.status = data.status
        if data.termination_date is not None:
            sb.termination_date = data.termination_date
        await self.db.flush()
        await self.db.refresh(sb)
        return SchemeBenefitResult(
            id=sb.id,
            tenant_id=sb.tenant_id,
            scheme_id=sb.scheme_id,
            benefit_id=sb.benefit_id,
            limit_amount=sb.limit_amount,
            copayment_percent=sb.copayment_percent,
            waiting_period_days=sb.waiting_period_days,
            status=sb.status,
            termination_date=sb.termination_date,
        )
