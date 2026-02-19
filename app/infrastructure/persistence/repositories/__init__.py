"""Repository implementations."""

from app.infrastructure.persistence.repositories.company_repo import CompanyRepository
from app.infrastructure.persistence.repositories.tenant_repo import TenantRepository

__all__ = ["CompanyRepository", "TenantRepository"]
