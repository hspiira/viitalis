"""Plan service: create, get, list, update. Tenant-scoped."""

from __future__ import annotations

from typing import TYPE_CHECKING

from app.application.dtos.plan import PlanCreate, PlanResult, PlanUpdate
from app.domain.exceptions import ResourceNotFoundException, ValidationException

if TYPE_CHECKING:
    from app.application.interfaces.repositories import IPlanRepository


class PlanService:
    """Plan use cases. Depends on IPlanRepository; tenant_id from repo."""

    def __init__(self, plan_repo: IPlanRepository) -> None:
        self.plan_repo = plan_repo

    async def create_plan(self, data: PlanCreate) -> PlanResult:
        """Create a plan for the tenant."""
        if not data.name or not data.name.strip():
            raise ValidationException("Plan name is required", field="name")
        return await self.plan_repo.create(data)

    async def get_by_id(self, plan_id: str) -> PlanResult:
        """Get plan by ID. Raises ResourceNotFoundException if not found."""
        plan = await self.plan_repo.get_by_id(plan_id)
        if not plan:
            raise ResourceNotFoundException("Plan not found")
        return plan

    async def list_plans(self, skip: int = 0, limit: int = 100) -> list[PlanResult]:
        """List plans for the tenant."""
        return await self.plan_repo.list_by_tenant(skip=skip, limit=limit)

    async def update_plan(self, plan_id: str, data: PlanUpdate) -> PlanResult:
        """Update a plan. Raises ResourceNotFoundException if not found."""
        updated = await self.plan_repo.update(plan_id, data)
        if not updated:
            raise ResourceNotFoundException("Plan not found")
        return updated
