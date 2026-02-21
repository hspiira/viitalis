"""Repository interfaces (ports) for the application layer."""

from datetime import date
from typing import Protocol

from app.application.dtos.claim import (
    ClaimCreate,
    ClaimDetailCreate,
    ClaimDetailResult,
    ClaimResult,
    ClaimUpdate,
)
from app.application.dtos.company import CompanyCreate, CompanyResult, CompanyUpdate
from app.application.dtos.company_branch import (
    CompanyBranchCreate,
    CompanyBranchResult,
    CompanyBranchUpdate,
)
from app.application.dtos.member import MemberCreate, MemberResult, MemberUpdate
from app.application.dtos.member_dependant import (
    MemberDependantCreate,
    MemberDependantResult,
    MemberDependantUpdate,
)
from app.application.dtos.plan import PlanCreate, PlanResult, PlanUpdate
from app.application.dtos.benefit import (
    SchemeBenefitCreate,
    SchemeBenefitResult,
    SchemeBenefitUpdate,
)
from app.application.dtos.scheme import (
    SchemeCreate,
    SchemePlanResult,
    SchemeResult,
    SchemeUpdate,
)
from app.application.dtos.tenant import TenantCreate, TenantResult


class ITenantRepository(Protocol):
    """Protocol for tenant repository (DIP)."""

    async def get_by_id(self, tenant_id: str) -> TenantResult | None:
        """Return tenant by ID."""
        ...

    async def get_by_code(self, code: str) -> TenantResult | None:
        """Return tenant by code."""
        ...

    async def list_all(self, skip: int = 0, limit: int = 100) -> list[TenantResult]:
        """Return tenants with pagination."""
        ...

    async def create(self, data: TenantCreate) -> TenantResult:
        """Create a tenant. Returns the created tenant."""
        ...


class ICompanyRepository(Protocol):
    """Protocol for company repository (DIP). Tenant-scoped."""

    async def get_by_id(self, company_id: str) -> CompanyResult | None:
        """Return company by ID (within tenant)."""
        ...

    async def list_by_tenant(self, skip: int = 0, limit: int = 100) -> list[CompanyResult]:
        """Return companies for the tenant with pagination."""
        ...

    async def create(self, data: CompanyCreate) -> CompanyResult:
        """Create a company (tenant from repo). Returns the created company."""
        ...

    async def update(self, company_id: str, data: CompanyUpdate) -> CompanyResult | None:
        """Update a company. Returns updated company or None if not found."""
        ...

    async def count_members(self, company_id: str) -> int:
        """Return number of members for this company (tenant-scoped, excludes soft-deleted)."""
        ...

    async def delete(self, company_id: str) -> bool:
        """Delete a company. Returns True if found and deleted."""
        ...


class ICompanyBranchRepository(Protocol):
    """Protocol for company branch repository (DIP). Tenant-scoped."""

    async def get_by_id(self, branch_id: str) -> CompanyBranchResult | None:
        """Return branch by ID (within tenant)."""
        ...

    async def list_by_company(
        self, company_id: str, skip: int = 0, limit: int = 100
    ) -> list[CompanyBranchResult]:
        """Return branches for a company with pagination."""
        ...

    async def create(self, data: CompanyBranchCreate) -> CompanyBranchResult:
        """Create a branch. Returns the created branch."""
        ...

    async def update(
        self, branch_id: str, data: CompanyBranchUpdate
    ) -> CompanyBranchResult | None:
        """Update a branch. Returns updated branch or None if not found."""
        ...


class ISchemeRepository(Protocol):
    """Protocol for scheme repository (DIP). Tenant-scoped."""

    async def get_by_id(self, scheme_id: str) -> SchemeResult | None:
        """Return scheme by ID (within tenant)."""
        ...

    async def list_by_tenant(
        self, skip: int = 0, limit: int = 100, company_id: str | None = None
    ) -> list[SchemeResult]:
        """Return schemes for the tenant (optionally by company_id) with pagination."""
        ...

    async def create(self, data: SchemeCreate) -> SchemeResult:
        """Create a scheme. Returns the created scheme."""
        ...

    async def update(self, scheme_id: str, data: SchemeUpdate) -> SchemeResult | None:
        """Update a scheme. Returns updated scheme or None if not found."""
        ...

    async def exists_scheme_plan(self, scheme_id: str, plan_id: str) -> bool:
        """True if this (scheme_id, plan_id) link already exists."""
        ...

    async def add_scheme_plan(
        self, scheme_id: str, plan_id: str
    ) -> SchemePlanResult:
        """Link a plan to a scheme. Returns the created scheme_plan."""
        ...

    async def list_scheme_benefits(
        self, scheme_id: str, skip: int = 0, limit: int = 100
    ) -> list[SchemeBenefitResult]:
        """Return scheme_benefits for a scheme."""
        ...

    async def exists_scheme_benefit(self, scheme_id: str, benefit_id: str) -> bool:
        """True if this (scheme_id, benefit_id) link already exists."""
        ...

    async def add_scheme_benefit(
        self, scheme_id: str, data: SchemeBenefitCreate
    ) -> SchemeBenefitResult:
        """Link a benefit to a scheme. Returns the created scheme_benefit."""
        ...

    async def get_scheme_benefit_by_id(
        self, scheme_benefit_id: str
    ) -> SchemeBenefitResult | None:
        """Return scheme_benefit by ID."""
        ...

    async def update_scheme_benefit(
        self, scheme_benefit_id: str, data: SchemeBenefitUpdate
    ) -> SchemeBenefitResult | None:
        """Update scheme_benefit (e.g. terminate). Returns updated or None."""
        ...


class IPlanRepository(Protocol):
    """Protocol for plan repository (DIP). Tenant-scoped."""

    async def get_by_id(self, plan_id: str) -> PlanResult | None:
        """Return plan by ID (within tenant)."""
        ...

    async def list_by_tenant(self, skip: int = 0, limit: int = 100) -> list[PlanResult]:
        """Return plans for the tenant with pagination."""
        ...

    async def create(self, data: PlanCreate) -> PlanResult:
        """Create a plan. Returns the created plan."""
        ...

    async def update(self, plan_id: str, data: PlanUpdate) -> PlanResult | None:
        """Update a plan. Returns updated plan or None if not found."""
        ...


class IMemberRepository(Protocol):
    """Protocol for member repository (DIP). Tenant-scoped. Excludes soft-deleted by default."""

    async def get_by_id(self, member_id: str) -> MemberResult | None:
        """Return member by ID (within tenant, not deleted)."""
        ...

    async def list_by_tenant(
        self,
        skip: int = 0,
        limit: int = 100,
        company_id: str | None = None,
        scheme_id: str | None = None,
    ) -> list[MemberResult]:
        """Return members for the tenant with optional filters. Excludes soft-deleted."""
        ...

    async def exists_by_card_no(
        self, card_no: str, exclude_member_id: str | None = None
    ) -> bool:
        """True if another member in this tenant has this card_no."""
        ...

    async def create(self, data: MemberCreate) -> MemberResult:
        """Create a member. Returns the created member."""
        ...

    async def update(self, member_id: str, data: MemberUpdate) -> MemberResult | None:
        """Update a member. Returns updated member or None if not found."""
        ...

    async def soft_delete(self, member_id: str) -> bool:
        """Soft-delete a member. Returns True if found and deleted."""
        ...


class IMemberDependantRepository(Protocol):
    """Protocol for member dependant repository (DIP). Tenant-scoped. Excludes soft-deleted by default."""

    async def get_by_id(self, dependant_id: str) -> MemberDependantResult | None:
        """Return dependant by ID (within tenant, not deleted)."""
        ...

    async def list_by_member(
        self, member_id: str, skip: int = 0, limit: int = 100
    ) -> list[MemberDependantResult]:
        """Return dependants for a member. Excludes soft-deleted."""
        ...

    async def exists_by_card_no(
        self, card_no: str, exclude_dependant_id: str | None = None
    ) -> bool:
        """True if another dependant in this tenant has this card_no."""
        ...

    async def create(self, data: MemberDependantCreate) -> MemberDependantResult:
        """Create a dependant. Returns the created dependant."""
        ...

    async def update(
        self, dependant_id: str, data: MemberDependantUpdate
    ) -> MemberDependantResult | None:
        """Update a dependant. Returns updated dependant or None if not found."""
        ...

    async def soft_delete(self, dependant_id: str) -> bool:
        """Soft-delete a dependant. Returns True if found and deleted."""
        ...


class IClaimRepository(Protocol):
    """Protocol for claim repository (DIP). Tenant-scoped."""

    async def exists_by_invoice_and_hospital(
        self, invoice_number: str, hospital_id: str
    ) -> bool:
        """True if a claim exists with same invoice_number and hospital_id."""
        ...

    async def exists_by_dependant_id(self, dependant_id: str) -> bool:
        """True if any claim references this dependant_id."""
        ...

    async def get_by_id(self, claim_id: str) -> ClaimResult | None:
        """Return claim by ID (within tenant)."""
        ...

    async def list_by_tenant(
        self,
        skip: int = 0,
        limit: int = 100,
        member_id: str | None = None,
        status: str | None = None,
        hospital_id: str | None = None,
        company_id: str | None = None,
        service_date_from: date | None = None,
        service_date_to: date | None = None,
    ) -> list[ClaimResult]:
        """Return claims with optional filters."""
        ...

    async def create_with_details(
        self, data: ClaimCreate, details: list[ClaimDetailCreate]
    ) -> ClaimResult:
        """Create claim and details in one transaction."""
        ...

    async def update(self, claim_id: str, data: ClaimUpdate) -> ClaimResult | None:
        """Update a claim."""
        ...

    async def list_details(self, claim_id: str) -> list[ClaimDetailResult]:
        """Return details for a claim."""
        ...

    async def update_approval(
        self,
        claim_id: str,
        approved: bool,
        approved_by: str | None = None,
        comments: str | None = None,
    ) -> ClaimResult | None:
        """Update claim approval. Returns updated claim or None."""
        ...

    async def bulk_approve(
        self,
        claim_ids: list[str],
        approved: bool,
        approved_by: str | None = None,
        comments: str | None = None,
    ) -> int:
        """Bulk update approval. Returns count of updated claims."""
        ...


