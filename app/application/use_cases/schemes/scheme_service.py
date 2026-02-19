"""Scheme service: create, get, list, update, add_plan_to_scheme. Tenant-scoped."""

from __future__ import annotations

from typing import TYPE_CHECKING

from app.application.dtos.scheme import (
    SchemeCreate,
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
    ) -> list[SchemeResult]:
        """List schemes for the tenant (optionally by company_id)."""
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
        self, scheme_id: str, plan_id: str
    ) -> SchemePlanResult:
        """Link a plan to a scheme. Fails if link already exists."""
        await self.get_by_id(scheme_id)  # raise if scheme not found
        if await self.scheme_repo.exists_scheme_plan(scheme_id, plan_id):
            raise ValidationException(
                "This plan is already linked to this scheme",
                field="plan_id",
            )
        return await self.scheme_repo.add_scheme_plan(scheme_id, plan_id)
