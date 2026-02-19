"""API v1 router aggregation."""

from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth,
    benefits,
    billing_sessions,
    catalogs,
    claim_payments,
    claims,
    companies,
    company_branches,
    doctors,
    health,
    hospitals,
    member_dependants,
    members,
    plans,
    reimbursements,
    schemes,
    tenants,
)

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(tenants.router, prefix="/tenants", tags=["tenants"])
api_router.include_router(companies.router, prefix="/companies", tags=["companies"])
api_router.include_router(
    company_branches.router,
    prefix="/companies/{company_id}/branches",
    tags=["company-branches"],
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
