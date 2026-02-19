"""Company branch service: create, get, list by company, update. Tenant-scoped."""

from __future__ import annotations

from typing import TYPE_CHECKING

from app.application.dtos.company_branch import (
    CompanyBranchCreate,
    CompanyBranchResult,
    CompanyBranchUpdate,
)
from app.domain.exceptions import ResourceNotFoundException, ValidationException

if TYPE_CHECKING:
    from app.application.interfaces.repositories import ICompanyBranchRepository


class CompanyBranchService:
    """Company branch use cases. Depends on ICompanyBranchRepository."""

    def __init__(self, branch_repo: ICompanyBranchRepository) -> None:
        self.branch_repo = branch_repo

    async def create_branch(self, data: CompanyBranchCreate) -> CompanyBranchResult:
        """Create a branch for a company."""
        if not data.name or not data.name.strip():
            raise ValidationException("Branch name is required", field="name")
        if not data.company_id or not data.company_id.strip():
            raise ValidationException("Branch must belong to a company", field="company_id")
        return await self.branch_repo.create(data)

    async def get_by_id(self, branch_id: str) -> CompanyBranchResult:
        """Get branch by ID. Raises ResourceNotFoundException if not found."""
        branch = await self.branch_repo.get_by_id(branch_id)
        if not branch:
            raise ResourceNotFoundException("Branch not found")
        return branch

    async def list_by_company(
        self, company_id: str, skip: int = 0, limit: int = 100
    ) -> list[CompanyBranchResult]:
        """List branches for a company."""
        return await self.branch_repo.list_by_company(
            company_id=company_id, skip=skip, limit=limit
        )

    async def update_branch(
        self, branch_id: str, data: CompanyBranchUpdate
    ) -> CompanyBranchResult:
        """Update a branch. Raises ResourceNotFoundException if not found."""
        updated = await self.branch_repo.update(branch_id, data)
        if not updated:
            raise ResourceNotFoundException("Branch not found")
        return updated
