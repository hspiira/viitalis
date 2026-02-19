"""Scheme repository. Tenant-scoped: all queries filter by tenant_id."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dtos.scheme import (
    SchemeCreate,
    SchemePlanResult,
    SchemeResult,
    SchemeUpdate,
)
from app.infrastructure.persistence.models.scheme import Scheme
from app.infrastructure.persistence.models.scheme_plan import SchemePlan


def _scheme_to_result(s: Scheme) -> SchemeResult:
    """Map ORM Scheme to SchemeResult."""
    return SchemeResult(
        id=s.id,
        tenant_id=s.tenant_id,
        company_id=s.company_id,
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

    async def create(self, data: SchemeCreate) -> SchemeResult:
        """Create a scheme (tenant_id from repo scope)."""
        scheme = Scheme(
            tenant_id=self.tenant_id,
            company_id=data.company_id,
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
        self, scheme_id: str, plan_id: str
    ) -> SchemePlanResult:
        """Link a plan to a scheme. Returns the created scheme_plan."""
        sp = SchemePlan(
            tenant_id=self.tenant_id,
            scheme_id=scheme_id,
            plan_id=plan_id,
        )
        self.db.add(sp)
        await self.db.flush()
        await self.db.refresh(sp)
        return SchemePlanResult(
            id=sp.id,
            tenant_id=sp.tenant_id,
            scheme_id=sp.scheme_id,
            plan_id=sp.plan_id,
        )
