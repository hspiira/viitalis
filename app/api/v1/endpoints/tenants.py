"""Tenant API: create (code + name only; admin + password generated), list, get by id."""

from dataclasses import asdict
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import SecretStr

from app.api.v1.dependencies import get_current_user, get_tenant_service
from app.application.dtos.user import UserResult
from app.application.dtos.tenant import TenantCreate
from app.application.use_cases.tenants import TenantService
from app.core.config import get_settings
from app.domain.enums import TenantStatus
from app.schemas.tenant import (
    TenantCreateRequest,
    TenantCreateResponse,
    TenantListItem,
    TenantResponse,
)

router = APIRouter()


def _to_response(t) -> TenantResponse:
    """Map TenantResult DTO to API response (DRY)."""
    return TenantResponse.model_validate(asdict(t))


def _to_list_item(t) -> TenantListItem:
    """Map TenantResult to list item response (DRY)."""
    return TenantListItem.model_validate(asdict(t))


@router.post("", response_model=TenantCreateResponse, status_code=201)
async def create_tenant(
    request: Request,
    body: TenantCreateRequest,
    tenant_svc: Annotated[TenantService, Depends(get_tenant_service)],
):
    """Create a tenant with admin user. User provides only company code and name.

    A password is generated and returned once in the response (store it securely).
    This endpoint is protected by a shared secret header:
    - Settings must define CREATE_TENANT_SECRET (otherwise tenant creation is disabled).
    - Requests must include X-Create-Tenant-Secret matching that value.
    """
    settings = get_settings()
    if not settings.create_tenant_secret:
        raise HTTPException(
            status_code=503,
            detail="Tenant creation is not configured (CREATE_TENANT_SECRET is not set).",
        )
    header_secret = request.headers.get("X-Create-Tenant-Secret")
    expected = settings.create_tenant_secret.get_secret_value()
    if not header_secret or header_secret != expected:
        raise HTTPException(status_code=401, detail="Unauthorized tenant creation")
    data = TenantCreate(code=body.code, name=body.name, status=TenantStatus.ACTIVE.value)
    result = await tenant_svc.create_tenant(data)
    return TenantCreateResponse(
        tenant_id=result.tenant_id,
        tenant_code=result.tenant_code,
        tenant_name=result.tenant_name,
        admin_username=result.admin_username,
        admin_email=result.admin_email,
        admin_initial_password=SecretStr(result.admin_initial_password),
    )


@router.get("", response_model=list[TenantListItem])
async def list_tenants(
    _user: Annotated[UserResult, Depends(get_current_user)],
    tenant_svc: Annotated[TenantService, Depends(get_tenant_service)],
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
):
    """List tenants with pagination. Requires authentication."""
    items = await tenant_svc.list_tenants(skip=skip, limit=limit)
    return [_to_list_item(t) for t in items]


@router.get("/{tenant_id}", response_model=TenantResponse)
async def get_tenant(
    _user: Annotated[UserResult, Depends(get_current_user)],
    tenant_id: str,
    tenant_svc: Annotated[TenantService, Depends(get_tenant_service)],
):
    """Get tenant by ID. Requires authentication."""
    tenant = await tenant_svc.get_by_id(tenant_id)
    return _to_response(tenant)
