"""Repository interfaces (ports) for the application layer."""

from typing import Protocol

from app.application.dtos.company import CompanyCreate, CompanyResult, CompanyUpdate
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


