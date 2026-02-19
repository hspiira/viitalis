"""Composition root: all FastAPI Depends for DB, repos, and use cases.

Routes depend only on these; no direct repo/service construction in routes.
"""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dtos.user import UserResult
from app.application.use_cases.auth import AuthService
from app.application.use_cases.catalogs import CatalogService
from app.application.use_cases.claim_payments import ClaimPaymentService
from app.application.use_cases.claims import ClaimService
from app.application.use_cases.company_branches import CompanyBranchService
from app.application.use_cases.companies import CompanyService
from app.application.use_cases.doctors import DoctorService
from app.application.use_cases.hospitals import HospitalBranchService, HospitalService
from app.application.use_cases.member_dependants import MemberDependantService
from app.application.use_cases.members import MemberService
from app.application.use_cases.plans import PlanService
from app.application.use_cases.reimbursements import ReimbursementService
from app.application.use_cases.schemes import SchemeService
from app.application.use_cases.tenants import TenantService
from app.core.config import get_settings
from app.core.tenant_validation import is_valid_tenant_id_format
from app.infrastructure.persistence.database import get_db, get_db_transactional
from app.infrastructure.persistence.repositories.app_user_repo import (
    AppUserRepository,
)
from app.infrastructure.persistence.repositories.claim_payment_repo import (
    ClaimPaymentRepository,
)
from app.infrastructure.persistence.repositories.claim_repo import ClaimRepository
from app.infrastructure.persistence.repositories.company_branch_repo import (
    CompanyBranchRepository,
)
from app.infrastructure.persistence.repositories.company_repo import CompanyRepository
from app.infrastructure.persistence.repositories.diagnosis_repo import DiagnosisRepository
from app.infrastructure.persistence.repositories.doctor_repo import DoctorRepository
from app.infrastructure.persistence.repositories.hospital_branch_repo import (
    HospitalBranchRepository,
)
from app.infrastructure.persistence.repositories.hospital_repo import HospitalRepository
from app.infrastructure.persistence.repositories.lab_repo import LabRepository
from app.infrastructure.persistence.repositories.medicine_repo import MedicineRepository
from app.infrastructure.persistence.repositories.member_dependant_repo import (
    MemberDependantRepository,
)
from app.infrastructure.persistence.repositories.member_repo import MemberRepository
from app.infrastructure.persistence.repositories.plan_repo import PlanRepository
from app.infrastructure.persistence.repositories.reimbursement_repo import (
    ReimbursementRepository,
)
from app.infrastructure.persistence.repositories.scheme_repo import SchemeRepository
from app.infrastructure.persistence.repositories.service_maintenance_repo import (
    ServiceMaintenanceRepository,
)
from app.infrastructure.persistence.repositories.tenant_repo import TenantRepository
from app.infrastructure.security.jwt import verify_token

# Read-only session (GET, list)
GetDb = Annotated[AsyncSession, Depends(get_db)]
# Transactional session (POST, PATCH, PUT, DELETE)
GetDbTransactional = Annotated[AsyncSession, Depends(get_db_transactional)]


async def get_tenant_repo(db: GetDb) -> TenantRepository:
    """Tenant repository for read operations (e.g. get_tenant_id validation)."""
    return TenantRepository(db)


async def get_auth_service(db: GetDb) -> AuthService:
    """Auth service for login (read-only: tenant + user lookup)."""
    tenant_repo = TenantRepository(db)
    user_repo = AppUserRepository(db, tenant_id=None)
    return AuthService(tenant_repo, user_repo)


async def get_current_user(
    request: Request,
    db: GetDb,
) -> UserResult:
    """Verify JWT from Authorization: Bearer <token> and return user. Raises 401 if invalid."""
    auth = request.headers.get("Authorization")
    if not auth or not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    token = auth[7:].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Missing token")
    try:
        payload = verify_token(token)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user_id = payload.get("sub")
    tenant_id = payload.get("tenant_id")
    if not user_id or not tenant_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    user_repo = AppUserRepository(db, tenant_id=tenant_id)
    user = await user_repo.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


async def get_tenant_id(
    request: Request,
    tenant_repo: Annotated[TenantRepository, Depends(get_tenant_repo)],
) -> str:
    """Resolve tenant ID from X-Tenant-ID header and validate it exists. Raises 400 if missing or invalid."""
    name = get_settings().tenant_header_name
    value = request.headers.get(name)
    if not value:
        raise HTTPException(
            status_code=400,
            detail=f"Missing required header: {name}",
        )
    if not is_valid_tenant_id_format(value):
        raise HTTPException(
            status_code=400,
            detail="Invalid tenant ID format (alphanumeric, hyphen, underscore; max 64 characters)",
        )
    tenant = await tenant_repo.get_by_id(value)
    if not tenant:
        raise HTTPException(status_code=400, detail="Invalid or unknown tenant")
    return value


async def get_tenant_service(db: GetDbTransactional) -> TenantService:
    """Tenant service for create/list/get (transactional session)."""
    repo = TenantRepository(db)
    return TenantService(repo)


async def get_company_service(
    db: GetDbTransactional,
    tenant_id: Annotated[str, Depends(get_tenant_id)],
) -> CompanyService:
    """Company service (transactional, tenant-scoped). Requires X-Tenant-ID."""
    repo = CompanyRepository(db, tenant_id)
    return CompanyService(repo)


async def get_company_branch_service(
    db: GetDbTransactional,
    tenant_id: Annotated[str, Depends(get_tenant_id)],
) -> CompanyBranchService:
    """Company branch service (transactional, tenant-scoped). Requires X-Tenant-ID."""
    repo = CompanyBranchRepository(db, tenant_id)
    return CompanyBranchService(repo)


async def get_scheme_service(
    db: GetDbTransactional,
    tenant_id: Annotated[str, Depends(get_tenant_id)],
) -> SchemeService:
    """Scheme service (transactional, tenant-scoped). Requires X-Tenant-ID."""
    repo = SchemeRepository(db, tenant_id)
    return SchemeService(repo)


async def get_plan_service(
    db: GetDbTransactional,
    tenant_id: Annotated[str, Depends(get_tenant_id)],
) -> PlanService:
    """Plan service (transactional, tenant-scoped). Requires X-Tenant-ID."""
    repo = PlanRepository(db, tenant_id)
    return PlanService(repo)


async def get_member_service(
    db: GetDbTransactional,
    tenant_id: Annotated[str, Depends(get_tenant_id)],
) -> MemberService:
    """Member service (transactional, tenant-scoped). Requires X-Tenant-ID."""
    repo = MemberRepository(db, tenant_id)
    return MemberService(repo)


async def get_member_dependant_service(
    db: GetDbTransactional,
    tenant_id: Annotated[str, Depends(get_tenant_id)],
) -> MemberDependantService:
    """Member dependant service (transactional, tenant-scoped). Requires X-Tenant-ID."""
    repo = MemberDependantRepository(db, tenant_id)
    return MemberDependantService(repo)


async def get_claim_service(
    db: GetDbTransactional,
    tenant_id: Annotated[str, Depends(get_tenant_id)],
) -> ClaimService:
    return ClaimService(ClaimRepository(db, tenant_id))


async def get_claim_payment_service(
    db: GetDbTransactional,
    tenant_id: Annotated[str, Depends(get_tenant_id)],
) -> ClaimPaymentService:
    return ClaimPaymentService(ClaimPaymentRepository(db, tenant_id))


async def get_hospital_service(
    db: GetDbTransactional,
    tenant_id: Annotated[str, Depends(get_tenant_id)],
) -> HospitalService:
    return HospitalService(HospitalRepository(db, tenant_id))


async def get_hospital_branch_service(
    db: GetDbTransactional,
    tenant_id: Annotated[str, Depends(get_tenant_id)],
) -> HospitalBranchService:
    return HospitalBranchService(HospitalBranchRepository(db, tenant_id))


async def get_doctor_service(
    db: GetDbTransactional,
    tenant_id: Annotated[str, Depends(get_tenant_id)],
) -> DoctorService:
    return DoctorService(DoctorRepository(db, tenant_id))


async def get_medicine_service(
    db: GetDbTransactional,
    tenant_id: Annotated[str, Depends(get_tenant_id)],
) -> CatalogService:
    return CatalogService(MedicineRepository(db, tenant_id))


async def get_services_service(
    db: GetDbTransactional,
    tenant_id: Annotated[str, Depends(get_tenant_id)],
) -> CatalogService:
    return CatalogService(ServiceMaintenanceRepository(db, tenant_id))


async def get_lab_service(
    db: GetDbTransactional,
    tenant_id: Annotated[str, Depends(get_tenant_id)],
) -> CatalogService:
    return CatalogService(LabRepository(db, tenant_id))


async def get_diagnosis_service(
    db: GetDbTransactional,
    tenant_id: Annotated[str, Depends(get_tenant_id)],
) -> CatalogService:
    return CatalogService(DiagnosisRepository(db, tenant_id))


async def get_reimbursement_service(
    db: GetDbTransactional,
    tenant_id: Annotated[str, Depends(get_tenant_id)],
) -> ReimbursementService:
    return ReimbursementService(ReimbursementRepository(db, tenant_id))


__all__ = [
    "GetDb",
    "GetDbTransactional",
    "get_auth_service",
    "get_claim_payment_service",
    "get_current_user",
    "get_claim_service",
    "get_company_branch_service",
    "get_company_service",
    "get_db",
    "get_db_transactional",
    "get_diagnosis_service",
    "get_doctor_service",
    "get_hospital_branch_service",
    "get_hospital_service",
    "get_lab_service",
    "get_medicine_service",
    "get_member_dependant_service",
    "get_member_service",
    "get_plan_service",
    "get_reimbursement_service",
    "get_scheme_service",
    "get_services_service",
    "get_tenant_id",
    "get_tenant_repo",
    "get_tenant_service",
]
