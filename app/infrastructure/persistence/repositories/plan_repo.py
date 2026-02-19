"""Plan repository. Tenant-scoped: all queries filter by tenant_id."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dtos.plan import PlanCreate, PlanResult, PlanUpdate
from app.infrastructure.persistence.models.plan import Plan


def _plan_to_result(p: Plan) -> PlanResult:
    """Map ORM Plan to PlanResult."""
    return PlanResult(
        id=p.id,
        tenant_id=p.tenant_id,
        name=p.name,
        code=p.code,
    )


class PlanRepository:
    """Plan repository. All access scoped to tenant_id."""

    def __init__(self, db: AsyncSession, tenant_id: str) -> None:
        self.db = db
        self.tenant_id = tenant_id

    async def get_by_id(self, plan_id: str) -> PlanResult | None:
        """Return plan by ID (within tenant)."""
        result = await self.db.execute(
            select(Plan).where(
                Plan.id == plan_id,
                Plan.tenant_id == self.tenant_id,
            )
        )
        plan = result.scalar_one_or_none()
        return _plan_to_result(plan) if plan else None

    async def list_by_tenant(
        self, skip: int = 0, limit: int = 100
    ) -> list[PlanResult]:
        """Return plans for the tenant with pagination."""
        result = await self.db.execute(
            select(Plan)
            .where(Plan.tenant_id == self.tenant_id)
            .offset(skip)
            .limit(limit)
            .order_by(Plan.name)
        )
        plans = result.scalars().all()
        return [_plan_to_result(p) for p in plans]

    async def create(self, data: PlanCreate) -> PlanResult:
        """Create a plan (tenant_id from repo scope)."""
        plan = Plan(
            tenant_id=self.tenant_id,
            name=data.name.strip(),
            code=data.code.strip() if data.code else None,
        )
        self.db.add(plan)
        await self.db.flush()
        await self.db.refresh(plan)
        return _plan_to_result(plan)

    async def update(self, plan_id: str, data: PlanUpdate) -> PlanResult | None:
        """Update a plan. Returns updated plan or None if not found."""
        result = await self.db.execute(
            select(Plan).where(
                Plan.id == plan_id,
                Plan.tenant_id == self.tenant_id,
            )
        )
        plan = result.scalar_one_or_none()
        if not plan:
            return None
        if data.name is not None:
            plan.name = data.name.strip()
        if data.code is not None:
            plan.code = data.code.strip() or None
        await self.db.flush()
        await self.db.refresh(plan)
        return _plan_to_result(plan)
