"""API v1 router aggregation."""

from fastapi import APIRouter

from app.api.v1.endpoints import (
    account_details,
    app_modules,
    auth,
    bank_branches,
    banks,
    card_replacement_reasons,
    card_replacements,
    benefits,
    billing_sessions,
    catalogs,
    claim_payments,
    claims,
    companies,
    company_branches,
    company_groups,
    company_types,
    departments,
    doctors,
    financial_periods,
    health,
    hospitals,
    insurance_types,
    medical_conditions,
    member_dependants,
    members,
    plans,
    reimbursements,
    reports,
    schemes,
    tenants,
    user_logs,
)

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(app_modules.router, prefix="/app-modules", tags=["app-modules"])
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(tenants.router, prefix="/tenants", tags=["tenants"])
api_router.include_router(companies.router, prefix="/companies", tags=["companies"])
api_router.include_router(banks.router, prefix="/banks", tags=["banks"])
api_router.include_router(
    card_replacement_reasons.router,
    prefix="/card-replacement-reasons",
    tags=["card-replacement-reasons"],
)
api_router.include_router(
    card_replacements.router,
    prefix="/card-replacements",
    tags=["card-replacements"],
)
api_router.include_router(
    bank_branches.router,
    prefix="/banks/{bank_id}/branches",
    tags=["bank-branches"],
)
api_router.include_router(
    account_details.router,
    prefix="/account-details",
    tags=["account-details"],
)
api_router.include_router(
    company_branches.router,
    prefix="/companies/{company_id}/branches",
    tags=["company-branches"],
)
api_router.include_router(
    company_groups.router, prefix="/company-groups", tags=["company-groups"]
)
api_router.include_router(
    company_types.router, prefix="/company-types", tags=["company-types"]
)
api_router.include_router(
    departments.router, prefix="/departments", tags=["departments"]
)
api_router.include_router(
    financial_periods.router,
    prefix="/financial-periods",
    tags=["financial-periods"],
)
api_router.include_router(
    insurance_types.router,
    prefix="/insurance-types",
    tags=["insurance-types"],
)
api_router.include_router(
    medical_conditions.router,
    prefix="/medical-conditions",
    tags=["medical-conditions"],
)
api_router.include_router(schemes.router, prefix="/schemes", tags=["schemes"])
api_router.include_router(benefits.router, prefix="/benefits", tags=["benefits"])
api_router.include_router(plans.router, prefix="/plans", tags=["plans"])
api_router.include_router(members.router, prefix="/members", tags=["members"])
api_router.include_router(
    member_dependants.router,
    prefix="/members/{member_id}/dependants",
    tags=["member-dependants"],
)
api_router.include_router(claims.router, prefix="/claims", tags=["claims"])
api_router.include_router(
    claim_payments.router, prefix="/claim-payments", tags=["claim-payments"]
)
api_router.include_router(
    billing_sessions.router, prefix="/billing-sessions", tags=["billing-sessions"]
)
api_router.include_router(hospitals.router, prefix="/hospitals", tags=["hospitals"])
api_router.include_router(doctors.router, prefix="/doctors", tags=["doctors"])
api_router.include_router(
    catalogs.medicines_router, prefix="/medicines", tags=["medicines"]
)
api_router.include_router(
    catalogs.services_router, prefix="/services", tags=["services"]
)
api_router.include_router(catalogs.labs_router, prefix="/labs", tags=["labs"])
api_router.include_router(
    catalogs.diagnoses_router, prefix="/diagnoses", tags=["diagnoses"]
)
api_router.include_router(
    reimbursements.router, prefix="/reimbursements", tags=["reimbursements"]
)
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(
    user_logs.router, prefix="/user-logs", tags=["user-logs"]
)
