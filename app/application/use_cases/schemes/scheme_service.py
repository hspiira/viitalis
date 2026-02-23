"""Scheme service: create, get, list, update, add_plan_to_scheme, scheme_benefits. Tenant-scoped."""

from __future__ import annotations

from datetime import date
from typing import TYPE_CHECKING

from app.application.dtos.benefit import (
    SchemeBenefitCreate,
    SchemeBenefitResult,
    SchemeBenefitUpdate,
)
from app.application.dtos.scheme import (
    SchemeCreate,
    SchemePlanCreate,
    SchemePlanResult,
    SchemeResult,
    SchemeUpdate,
)
from app.domain.exceptions import ResourceNotFoundException, ValidationException

if TYPE_CHECKING:
    from app.application.interfaces.repositories import ISchemeRepository


class SchemeService:
    """Scheme use cases. Depends on ISchemeRepository; tenant_id from repo."""

    def __init__(self, scheme_repo: ISchemeRepository) -> None:
        self.scheme_repo = scheme_repo

    async def create_scheme(self, data: SchemeCreate) -> SchemeResult:
        """Create a scheme for the tenant."""
        if not data.name or not data.name.strip():
            raise ValidationException("Scheme name is required", field="name")
        if not data.company_id or not data.company_id.strip():
            raise ValidationException("Scheme must belong to a company", field="company_id")
        return await self.scheme_repo.create(data)

    async def get_by_id(self, scheme_id: str) -> SchemeResult:
        """Get scheme by ID. Raises ResourceNotFoundException if not found."""
        scheme = await self.scheme_repo.get_by_id(scheme_id)
        if not scheme:
            raise ResourceNotFoundException("Scheme not found")
        return scheme

    async def list_schemes(
        self,
        skip: int = 0,
        limit: int = 100,
        company_id: str | None = None,
        code: str | None = None,
    ) -> list[SchemeResult]:
        """List schemes for the tenant (optionally by company_id or code)."""
        if code is not None and code.strip():
            return await self.scheme_repo.list_by_code(code.strip())
        return await self.scheme_repo.list_by_tenant(
            skip=skip, limit=limit, company_id=company_id
        )

    async def update_scheme(self, scheme_id: str, data: SchemeUpdate) -> SchemeResult:
        """Update a scheme. Raises ResourceNotFoundException if not found."""
        updated = await self.scheme_repo.update(scheme_id, data)
        if not updated:
            raise ResourceNotFoundException("Scheme not found")
        return updated

    async def add_plan_to_scheme(
        self, scheme_id: str, plan_id: str, **kwargs: object
    ) -> SchemePlanResult:
        """Link a plan to a scheme. When limit_amount/begin_date/end_date are provided, allows multiple rows (periods)."""
        await self.get_by_id(scheme_id)  # raise if scheme not found
        has_period = (
            kwargs.get("limit_amount") is not None
            or kwargs.get("begin_date") is not None
            or kwargs.get("end_date") is not None
        )
        if not has_period and await self.scheme_repo.exists_scheme_plan(scheme_id, plan_id):
            raise ValidationException(
                "This plan is already linked to this scheme",
                field="plan_id",
            )
        data = SchemePlanCreate(
            scheme_id=scheme_id,
            plan_id=plan_id,
            limit_amount=kwargs.get("limit_amount"),
            begin_date=kwargs.get("begin_date"),
            end_date=kwargs.get("end_date"),
            status=kwargs.get("status", "active"),
        )
        return await self.scheme_repo.add_scheme_plan(data)

    async def list_scheme_plans(
        self, scheme_id: str, skip: int = 0, limit: int = 100
    ) -> list[SchemePlanResult]:
        """List plans linked to a scheme."""
        await self.get_by_id(scheme_id)
        return await self.scheme_repo.list_scheme_plans(
            scheme_id, skip=skip, limit=limit
        )

    async def list_scheme_benefits(
        self, scheme_id: str, skip: int = 0, limit: int = 100
    ) -> list[SchemeBenefitResult]:
        await self.get_by_id(scheme_id)
        return await self.scheme_repo.list_scheme_benefits(
            scheme_id, skip=skip, limit=limit
        )

    async def add_benefit_to_scheme(
        self, scheme_id: str, data: SchemeBenefitCreate
    ) -> SchemeBenefitResult:
        await self.get_by_id(scheme_id)
        if await self.scheme_repo.exists_scheme_benefit(scheme_id, data.benefit_id):
            raise ValidationException(
                "This benefit is already linked to this scheme",
                field="benefit_id",
            )
        return await self.scheme_repo.add_scheme_benefit(scheme_id, data)

    async def get_scheme_benefit(
        self, scheme_benefit_id: str
    ) -> SchemeBenefitResult:
        sb = await self.scheme_repo.get_scheme_benefit_by_id(scheme_benefit_id)
        if not sb:
            raise ResourceNotFoundException("Scheme benefit not found")
        return sb

    async def terminate_scheme_benefit(
        self, scheme_benefit_id: str, termination_date: date | None = None
    ) -> SchemeBenefitResult:
        await self.get_scheme_benefit(scheme_benefit_id)
        updated = await self.scheme_repo.update_scheme_benefit(
            scheme_benefit_id,
            SchemeBenefitUpdate(
                status="terminated",
                termination_date=termination_date or date.today(),
            ),
        )
        if not updated:
            raise ResourceNotFoundException("Scheme benefit not found")
        return updated
