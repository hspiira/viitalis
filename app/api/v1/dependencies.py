"""Composition root: all FastAPI Depends for DB, repos, and use cases.

Routes depend only on these; no direct repo/service construction in routes.
"""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dtos.user import UserResult
from app.application.use_cases.account_details import AccountDetailService
from app.application.use_cases.auth import AuthService
from app.application.use_cases.bank_account_details import BankAccountDetailService
from app.application.use_cases.bank_branches import BankBranchService
from app.application.use_cases.banks import BankService
from app.application.use_cases.benefit_linkages import BenefitLinkageService
from app.application.use_cases.card_replacement_reasons import (
    CardReplacementReasonService,
)
from app.application.use_cases.card_replacements import CardReplacementService
from app.application.use_cases.benefits import BenefitService
from app.application.use_cases.billing_sessions import BillingSessionService
from app.application.use_cases.catalog_upload import CatalogUploadService
from app.application.use_cases.catalogs import CatalogService
from app.application.use_cases.claim_payments import ClaimPaymentService
from app.application.use_cases.claims import ClaimService
from app.application.use_cases.company_branches import CompanyBranchService
from app.application.use_cases.companies import CompanyService
from app.application.use_cases.company_groups import CompanyGroupService
from app.application.use_cases.company_types import CompanyTypeService
from app.application.use_cases.departments import DepartmentService
from app.application.use_cases.doctors import DoctorService
from app.application.use_cases.financial_periods import FinancialPeriodService
from app.application.use_cases.import_members import ImportMembersService
from app.application.use_cases.insurance_types import InsuranceTypeService
from app.application.use_cases.medical_conditions import MedicalConditionService
from app.application.use_cases.hospital_pricing import HospitalPricingService
from app.application.use_cases.hospitals import HospitalBranchService, HospitalService
from app.application.use_cases.member_dependants import MemberDependantService
from app.application.use_cases.members import MemberService
from app.application.use_cases.plans import PlanService
from app.application.use_cases.reimbursements import ReimbursementService
from app.application.use_cases.schemes import SchemeService
from app.application.use_cases.tenants import TenantService
from app.application.use_cases.app_modules import AppModuleService
from app.application.use_cases.user_logs import UserLogService
from app.application.use_cases.user_profile import UserProfileService
from app.application.use_cases.user_permissions import UserPermissionsService
from app.core.config import get_settings
from app.core.tenant_validation import is_valid_tenant_id_format
from app.infrastructure.persistence.database import get_db, get_db_transactional
from app.infrastructure.persistence.repositories.account_detail_repo import (
    AccountDetailRepository,
)
from app.infrastructure.persistence.repositories.app_user_detail_repo import (
    AppUserDetailRepository,
)
from app.infrastructure.persistence.repositories.app_user_log_repo import (
    AppUserLogRepository,
)
from app.infrastructure.persistence.repositories.app_user_repo import (
    AppUserRepository,
)
from app.infrastructure.persistence.repositories.app_module_repo import (
    AppModuleRepository,
)
from app.infrastructure.persistence.repositories.app_permission_repo import (
    AppPermissionRepository,
)
from app.infrastructure.persistence.repositories.bank_account_detail_repo import (
    BankAccountDetailRepository,
)
from app.infrastructure.persistence.repositories.bank_branch_repo import (
    BankBranchRepository,
)
from app.infrastructure.persistence.repositories.bank_repo import BankRepository
from app.infrastructure.persistence.repositories.card_replacement_reason_repo import (
    CardReplacementReasonRepository,
)
from app.infrastructure.persistence.repositories.card_replacement_repo import (
    CardReplacementRepository,
)
from app.infrastructure.persistence.repositories.benefit_linkage_repo import (
    BenefitLinkageRepository,
)
from app.infrastructure.persistence.repositories.benefit_repo import (
    BenefitRepository,
)
from app.infrastructure.persistence.repositories.billing_session_repo import (
    BillingSessionRepository,
)
from app.infrastructure.persistence.repositories.claim_payment_repo import (
    ClaimPaymentRepository,
)
from app.infrastructure.persistence.repositories.claim_repo import ClaimRepository
from app.infrastructure.persistence.repositories.hospital_pricing_repo import (
    HospitalPricingRepository,
)
from app.infrastructure.persistence.repositories.company_branch_repo import (
    CompanyBranchRepository,
)
from app.infrastructure.persistence.repositories.company_repo import CompanyRepository
from app.infrastructure.persistence.repositories.company_group_repo import (
    CompanyGroupRepository,
)
from app.infrastructure.persistence.repositories.company_type_repo import (
    CompanyTypeRepository,
)
from app.infrastructure.persistence.repositories.catalog_repo import (
    DiagnosisRepository,
    LabRepository,
    LabTypeRepository,
    MedicineRepository,
    ServiceMaintenanceRepository,
)
from app.infrastructure.persistence.repositories.department_repo import (
    DepartmentRepository,
)
from app.infrastructure.persistence.repositories.doctor_repo import DoctorRepository
from app.infrastructure.persistence.repositories.financial_period_repo import (
    FinancialPeriodRepository,
)
from app.infrastructure.persistence.repositories.hospital_branch_repo import (
    HospitalBranchRepository,
)
from app.infrastructure.persistence.repositories.hospital_repo import HospitalRepository
from app.infrastructure.persistence.repositories.insurance_type_repo import (
    InsuranceTypeRepository,
)
from app.infrastructure.persistence.repositories.member_dependant_repo import (
    MemberDependantRepository,
)
from app.infrastructure.persistence.repositories.member_repo import MemberRepository
from app.infrastructure.persistence.repositories.medical_condition_repo import (
    MedicalConditionRepository,
)
from app.infrastructure.persistence.repositories.plan_repo import PlanRepository
from app.infrastructure.persistence.repositories.reimbursement_repo import (
    ReimbursementRepository,
)
from app.infrastructure.persistence.repositories.report_repo import ReportRepository
from app.infrastructure.persistence.repositories.scheme_repo import SchemeRepository
from app.infrastructure.persistence.repositories.tenant_repo import TenantRepository
from app.infrastructure.security.jwt import verify_token

# Read-only session (GET, list)
GetDb = Annotated[AsyncSession, Depends(get_db)]
# Transactional session (POST, PATCH, PUT, DELETE)
GetDbTransactional = Annotated[AsyncSession, Depends(get_db_transactional)]


async def get_tenant_repo(db: GetDb) -> TenantRepository:
    """Tenant repository for read operations (e.g. get_tenant_id validation)."""
    return TenantRepository(db)


async def get_app_user_log_repo(db: GetDbTransactional) -> AppUserLogRepository:
    """App user log repository (append-only). Use transactional session for writes."""
    return AppUserLogRepository(db)


async def get_user_profile_service(db: GetDbTransactional) -> UserProfileService:
    """User profile service: get user with optional detail (for /me), update profile."""
    return UserProfileService(
        AppUserRepository(db, tenant_id=None),
        AppUserDetailRepository(db),
    )


async def get_user_permissions_service(db: GetDb) -> UserPermissionsService:
    """User permissions service: list permissions for user with module info."""
    return UserPermissionsService(
        AppPermissionRepository(db),
        AppModuleRepository(db),
    )


async def get_app_module_service(db: GetDb) -> AppModuleService:
    """App module service: list global modules."""
    return AppModuleService(AppModuleRepository(db))


async def get_user_log_service(db: GetDb) -> UserLogService:
    """User log service: list audit logs by tenant."""
    return UserLogService(AppUserLogRepository(db))


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
    if not isinstance(user_id, str) or not isinstance(tenant_id, str):
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


async def get_authenticated_tenant_id(
    request: Request,
    current_user: Annotated[UserResult, Depends(get_current_user)],
    tenant_repo: Annotated[TenantRepository, Depends(get_tenant_repo)],
) -> str:
    """Require JWT and ensure token tenant matches X-Tenant-ID. Returns tenant_id. Raises 400/403 if missing or mismatch."""
    name = get_settings().tenant_header_name
    value = request.headers.get(name)
    if not value:
        raise HTTPException(status_code=400, detail=f"Missing required header: {name}")
    if not is_valid_tenant_id_format(value):
        raise HTTPException(
            status_code=400,
            detail="Invalid tenant ID format (alphanumeric, hyphen, underscore; max 64 characters)",
        )
    tenant = await tenant_repo.get_by_id(value)
    if not tenant:
        raise HTTPException(status_code=400, detail="Invalid or unknown tenant")
    if current_user.tenant_id != value:
        raise HTTPException(status_code=403, detail="Tenant does not match token")
    return value


async def get_tenant_service(db: GetDbTransactional) -> TenantService:
    """Tenant service for create/list/get (transactional session). Creates admin user when admin_* provided."""
    return TenantService(
        TenantRepository(db),
        user_repo=AppUserRepository(db, tenant_id=None),
        module_repo=AppModuleRepository(db),
        permission_repo=AppPermissionRepository(db),
    )


async def get_company_service(
    db: GetDbTransactional,
    tenant_id: Annotated[str, Depends(get_authenticated_tenant_id)],
) -> CompanyService:
    """Company service (transactional, tenant-scoped). Requires X-Tenant-ID."""
    repo = CompanyRepository(db, tenant_id)
    return CompanyService(repo)


async def get_company_branch_service(
    db: GetDbTransactional,
    tenant_id: Annotated[str, Depends(get_authenticated_tenant_id)],
) -> CompanyBranchService:
    """Company branch service (transactional, tenant-scoped). Requires X-Tenant-ID."""
    repo = CompanyBranchRepository(db, tenant_id)
    return CompanyBranchService(repo)


async def get_scheme_service(
    db: GetDbTransactional,
    tenant_id: Annotated[str, Depends(get_authenticated_tenant_id)],
) -> SchemeService:
    """Scheme service (transactional, tenant-scoped). Requires X-Tenant-ID."""
    repo = SchemeRepository(db, tenant_id)
    return SchemeService(repo)


async def get_plan_service(
    db: GetDbTransactional,
    tenant_id: Annotated[str, Depends(get_authenticated_tenant_id)],
) -> PlanService:
    """Plan service (transactional, tenant-scoped). Requires X-Tenant-ID."""
    repo = PlanRepository(db, tenant_id)
    return PlanService(repo)


async def get_member_service(
    db: GetDbTransactional,
    tenant_id: Annotated[str, Depends(get_authenticated_tenant_id)],
) -> MemberService:
    """Member service (transactional, tenant-scoped). Requires X-Tenant-ID."""
    repo = MemberRepository(db, tenant_id)
    return MemberService(repo)


async def get_import_members_service(
    db: GetDbTransactional,
    tenant_id: Annotated[str, Depends(get_authenticated_tenant_id)],
) -> ImportMembersService:
    """Import members service (batch). Requires X-Tenant-ID."""
    return ImportMembersService(
        MemberRepository(db, tenant_id),
        CompanyRepository(db, tenant_id),
        SchemeRepository(db, tenant_id),
    )


async def get_member_dependant_service(
    db: GetDbTransactional,
    tenant_id: Annotated[str, Depends(get_authenticated_tenant_id)],
) -> MemberDependantService:
    """Member dependant service (transactional, tenant-scoped). Requires X-Tenant-ID."""
    return MemberDependantService(
        MemberDependantRepository(db, tenant_id),
        ClaimRepository(db, tenant_id),
    )


async def get_claim_service(
    db: GetDbTransactional,
    tenant_id: Annotated[str, Depends(get_authenticated_tenant_id)],
) -> ClaimService:
    return ClaimService(
        ClaimRepository(db, tenant_id),
        MemberRepository(db, tenant_id),
        SchemeRepository(db, tenant_id),
        HospitalPricingRepository(db, tenant_id),
    )


async def get_claim_payment_service(
    db: GetDbTransactional,
    tenant_id: Annotated[str, Depends(get_authenticated_tenant_id)],
) -> ClaimPaymentService:
    return ClaimPaymentService(
        ClaimPaymentRepository(db, tenant_id),
        ClaimRepository(db, tenant_id),
    )


async def get_hospital_service(
    db: GetDbTransactional,
    tenant_id: Annotated[str, Depends(get_authenticated_tenant_id)],
) -> HospitalService:
    return HospitalService(HospitalRepository(db, tenant_id))


async def get_hospital_pricing_service(
    db: GetDbTransactional,
    tenant_id: Annotated[str, Depends(get_authenticated_tenant_id)],
) -> HospitalPricingService:
    return HospitalPricingService(HospitalPricingRepository(db, tenant_id))


async def get_hospital_branch_service(
    db: GetDbTransactional,
    tenant_id: Annotated[str, Depends(get_authenticated_tenant_id)],
) -> HospitalBranchService:
    return HospitalBranchService(HospitalBranchRepository(db, tenant_id))


async def get_doctor_service(
    db: GetDbTransactional,
    tenant_id: Annotated[str, Depends(get_authenticated_tenant_id)],
) -> DoctorService:
    return DoctorService(DoctorRepository(db, tenant_id))


async def get_medicine_service(
    db: GetDbTransactional,
    tenant_id: Annotated[str, Depends(get_authenticated_tenant_id)],
) -> CatalogService:
    return CatalogService(MedicineRepository(db, tenant_id))


async def get_catalog_upload_service(
    db: GetDbTransactional,
    tenant_id: Annotated[str, Depends(get_authenticated_tenant_id)],
) -> CatalogUploadService:
    """Catalog upload for medicines, services, labs, and lab types. Requires X-Tenant-ID."""
    return CatalogUploadService(
        MedicineRepository(db, tenant_id),
        ServiceMaintenanceRepository(db, tenant_id),
        LabRepository(db, tenant_id),
        LabTypeRepository(db, tenant_id),
    )


async def get_services_service(
    db: GetDbTransactional,
    tenant_id: Annotated[str, Depends(get_authenticated_tenant_id)],
) -> CatalogService:
    return CatalogService(ServiceMaintenanceRepository(db, tenant_id))


async def get_lab_service(
    db: GetDbTransactional,
    tenant_id: Annotated[str, Depends(get_authenticated_tenant_id)],
) -> CatalogService:
    return CatalogService(LabRepository(db, tenant_id))


async def get_lab_type_service(
    db: GetDbTransactional,
    tenant_id: Annotated[str, Depends(get_authenticated_tenant_id)],
) -> CatalogService:
    return CatalogService(LabTypeRepository(db, tenant_id))


async def get_diagnosis_service(
    db: GetDbTransactional,
    tenant_id: Annotated[str, Depends(get_authenticated_tenant_id)],
) -> CatalogService:
    return CatalogService(DiagnosisRepository(db, tenant_id))


async def get_reimbursement_service(
    db: GetDbTransactional,
    tenant_id: Annotated[str, Depends(get_authenticated_tenant_id)],
) -> ReimbursementService:
    return ReimbursementService(ReimbursementRepository(db, tenant_id))


async def get_billing_session_service(
    db: GetDbTransactional,
    tenant_id: Annotated[str, Depends(get_authenticated_tenant_id)],
) -> BillingSessionService:
    return BillingSessionService(BillingSessionRepository(db, tenant_id))


async def get_benefit_service(
    db: GetDbTransactional,
    tenant_id: Annotated[str, Depends(get_authenticated_tenant_id)],
) -> BenefitService:
    return BenefitService(BenefitRepository(db, tenant_id))


async def get_benefit_linkage_service(
    db: GetDbTransactional,
    tenant_id: Annotated[str, Depends(get_authenticated_tenant_id)],
) -> BenefitLinkageService:
    return BenefitLinkageService(
        BenefitLinkageRepository(db, tenant_id),
        BenefitRepository(db, tenant_id),
    )


async def get_card_replacement_reason_service(
    db: GetDbTransactional,
    tenant_id: Annotated[str, Depends(get_authenticated_tenant_id)],
) -> CardReplacementReasonService:
    return CardReplacementReasonService(
        CardReplacementReasonRepository(db, tenant_id),
    )


async def get_card_replacement_service(
    db: GetDbTransactional,
    tenant_id: Annotated[str, Depends(get_authenticated_tenant_id)],
) -> CardReplacementService:
    return CardReplacementService(
        CardReplacementRepository(db, tenant_id),
        CardReplacementReasonRepository(db, tenant_id),
        MemberRepository(db, tenant_id),
        MemberDependantRepository(db, tenant_id),
    )


async def get_report_repo(
    db: GetDb,
    tenant_id: Annotated[str, Depends(get_authenticated_tenant_id)],
) -> ReportRepository:
    """Read-only report repository (tenant-scoped). Requires X-Tenant-ID."""
    return ReportRepository(db, tenant_id)


async def get_company_type_service(
    db: GetDbTransactional,
    tenant_id: Annotated[str, Depends(get_authenticated_tenant_id)],
) -> CompanyTypeService:
    return CompanyTypeService(CompanyTypeRepository(db, tenant_id))


async def get_company_group_service(
    db: GetDbTransactional,
    tenant_id: Annotated[str, Depends(get_authenticated_tenant_id)],
) -> CompanyGroupService:
    return CompanyGroupService(CompanyGroupRepository(db, tenant_id))


async def get_department_service(
    db: GetDbTransactional,
    tenant_id: Annotated[str, Depends(get_authenticated_tenant_id)],
) -> DepartmentService:
    return DepartmentService(DepartmentRepository(db, tenant_id))


async def get_financial_period_service(
    db: GetDbTransactional,
    tenant_id: Annotated[str, Depends(get_authenticated_tenant_id)],
) -> FinancialPeriodService:
    return FinancialPeriodService(FinancialPeriodRepository(db, tenant_id))


async def get_insurance_type_service(
    db: GetDbTransactional,
    tenant_id: Annotated[str, Depends(get_authenticated_tenant_id)],
) -> InsuranceTypeService:
    return InsuranceTypeService(InsuranceTypeRepository(db, tenant_id))


async def get_medical_condition_service(
    db: GetDbTransactional,
    tenant_id: Annotated[str, Depends(get_authenticated_tenant_id)],
) -> MedicalConditionService:
    return MedicalConditionService(MedicalConditionRepository(db, tenant_id))


async def get_bank_service(
    db: GetDbTransactional,
    tenant_id: Annotated[str, Depends(get_authenticated_tenant_id)],
) -> BankService:
    return BankService(BankRepository(db, tenant_id))


async def get_bank_branch_service(
    db: GetDbTransactional,
    tenant_id: Annotated[str, Depends(get_authenticated_tenant_id)],
) -> BankBranchService:
    return BankBranchService(
        BankBranchRepository(db, tenant_id),
        BankRepository(db, tenant_id),
    )


async def get_account_detail_service(
    db: GetDbTransactional,
    tenant_id: Annotated[str, Depends(get_authenticated_tenant_id)],
) -> AccountDetailService:
    return AccountDetailService(AccountDetailRepository(db, tenant_id))


async def get_bank_account_detail_service(
    db: GetDbTransactional,
    tenant_id: Annotated[str, Depends(get_authenticated_tenant_id)],
) -> BankAccountDetailService:
    return BankAccountDetailService(
        BankAccountDetailRepository(db, tenant_id),
        AccountDetailRepository(db, tenant_id),
        BankRepository(db, tenant_id),
    )


__all__ = [
    "GetDb",
    "GetDbTransactional",
    "get_account_detail_service",
    "get_authenticated_tenant_id",
    "get_app_module_service",
    "get_app_user_log_repo",
    "get_auth_service",
    "get_user_profile_service",
    "get_user_log_service",
    "get_user_permissions_service",
    "get_bank_account_detail_service",
    "get_bank_branch_service",
    "get_bank_service",
    "get_benefit_linkage_service",
    "get_benefit_service",
    "get_billing_session_service",
    "get_claim_payment_service",
    "get_current_user",
    "get_claim_service",
    "get_company_branch_service",
    "get_company_group_service",
    "get_company_service",
    "get_card_replacement_reason_service",
    "get_card_replacement_service",
    "get_company_type_service",
    "get_department_service",
    "get_financial_period_service",
    "get_insurance_type_service",
    "get_medical_condition_service",
    "get_db",
    "get_db_transactional",
    "get_diagnosis_service",
    "get_doctor_service",
    "get_hospital_branch_service",
    "get_hospital_pricing_service",
    "get_hospital_service",
    "get_import_members_service",
    "get_lab_service",
    "get_medicine_service",
    "get_catalog_upload_service",
    "get_report_repo",
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
