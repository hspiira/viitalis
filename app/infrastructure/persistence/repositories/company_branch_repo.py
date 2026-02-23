"""Company branch repository. Tenant-scoped."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dtos.company_branch import (
    CompanyBranchCreate,
    CompanyBranchResult,
    CompanyBranchUpdate,
)
from app.infrastructure.persistence.models.company_branch import CompanyBranch


def _branch_to_result(b: CompanyBranch) -> CompanyBranchResult:
    """Map ORM CompanyBranch to CompanyBranchResult."""
    return CompanyBranchResult(
        id=b.id,
        tenant_id=b.tenant_id,
        company_id=b.company_id,
        name=b.name,
        address=b.address,
        phone=b.phone,
    )


class CompanyBranchRepository:
    """Company branch repository. All access scoped to tenant_id."""

    def __init__(self, db: AsyncSession, tenant_id: str) -> None:
        self.db = db
        self.tenant_id = tenant_id

    async def get_by_id(self, branch_id: str) -> CompanyBranchResult | None:
        """Return branch by ID (within tenant)."""
        result = await self.db.execute(
            select(CompanyBranch).where(
                CompanyBranch.id == branch_id,
                CompanyBranch.tenant_id == self.tenant_id,
            )
        )
        branch = result.scalar_one_or_none()
        return _branch_to_result(branch) if branch else None

    async def list_by_company(
        self, company_id: str, skip: int = 0, limit: int = 100
    ) -> list[CompanyBranchResult]:
        """Return branches for a company with pagination."""
        result = await self.db.execute(
            select(CompanyBranch)
            .where(
                CompanyBranch.tenant_id == self.tenant_id,
                CompanyBranch.company_id == company_id,
            )
            .offset(skip)
            .limit(limit)
            .order_by(CompanyBranch.name)
        )
        branches = result.scalars().all()
        return [_branch_to_result(b) for b in branches]

    async def create(self, data: CompanyBranchCreate) -> CompanyBranchResult:
        """Create a branch (tenant_id from repo scope)."""
        branch = CompanyBranch(
            tenant_id=self.tenant_id,
            company_id=data.company_id,
            name=data.name.strip(),
            address=data.address.strip() if data.address else None,
            phone=data.phone.strip() if data.phone else None,
        )
        self.db.add(branch)
        await self.db.flush()
        await self.db.refresh(branch)
        return _branch_to_result(branch)

    async def update(
        self, branch_id: str, data: CompanyBranchUpdate
    ) -> CompanyBranchResult | None:
        """Update a branch. Returns updated branch or None if not found."""
        result = await self.db.execute(
            select(CompanyBranch).where(
                CompanyBranch.id == branch_id,
                CompanyBranch.tenant_id == self.tenant_id,
            )
        )
        branch = result.scalar_one_or_none()
        if not branch:
            return None
        if data.name is not None:
            branch.name = data.name.strip()
        if data.address is not None:
            branch.address = data.address.strip() or None
        if data.phone is not None:
            branch.phone = data.phone.strip() or None
        await self.db.flush()
        await self.db.refresh(branch)
        return _branch_to_result(branch)
