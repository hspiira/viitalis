"""Company service: create, get, list, update. Tenant-scoped."""

from __future__ import annotations

from typing import TYPE_CHECKING

from app.application.dtos.company import CompanyCreate, CompanyResult, CompanyUpdate
from app.domain.exceptions import ResourceNotFoundException, ValidationException

if TYPE_CHECKING:
    from app.application.interfaces.repositories import ICompanyRepository


class CompanyService:
    """Company use cases. Depends on ICompanyRepository; tenant_id from caller."""

    def __init__(self, company_repo: ICompanyRepository) -> None:
        self.company_repo = company_repo

    async def create_company(self, data: CompanyCreate) -> CompanyResult:
        """Create a company for the tenant (tenant from repo)."""
        if not data.name or not data.name.strip():
            raise ValidationException("Company name is required", field="name")
        return await self.company_repo.create(data)

    async def get_by_id(self, company_id: str) -> CompanyResult:
        """Get company by ID. Raises ResourceNotFoundException if not found."""
        company = await self.company_repo.get_by_id(company_id)
        if not company:
            raise ResourceNotFoundException("Company not found")
        return company

    async def list_companies(self, skip: int = 0, limit: int = 100) -> list[CompanyResult]:
        """List companies for the tenant."""
        return await self.company_repo.list_by_tenant(skip=skip, limit=limit)

    async def update_company(self, company_id: str, data: CompanyUpdate) -> CompanyResult:
        """Update a company. Raises ResourceNotFoundException if not found."""
        updated = await self.company_repo.update(company_id, data)
        if not updated:
            raise ResourceNotFoundException("Company not found")
        return updated
