"""Tenant API: create, list, get by id. Create gated by X-Create-Tenant-Secret when set."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Request

from app.api.v1.dependencies import get_current_user, get_tenant_service
from app.application.dtos.user import UserResult
from app.application.dtos.tenant import TenantCreate
from app.application.use_cases.tenants import TenantService
from app.core.config import get_settings
from app.schemas.tenant import TenantCreateRequest, TenantListItem, TenantResponse

router = APIRouter()


def _to_response(t) -> TenantResponse:
    """Map TenantResult DTO to API response (DRY)."""
    return TenantResponse.model_validate(t)


def _to_list_item(t) -> TenantListItem:
    """Map TenantResult to list item response (DRY)."""
    return TenantListItem.model_validate(t)


@router.post("", response_model=TenantResponse, status_code=201)
async def create_tenant(
    request: Request,
    body: TenantCreateRequest,
    tenant_svc: Annotated[TenantService, Depends(get_tenant_service)],
):
    """Create a tenant. When CREATE_TENANT_SECRET is set, X-Create-Tenant-Secret header must match."""
    settings = get_settings()
    if settings.create_tenant_secret is not None:
        secret = request.headers.get("X-Create-Tenant-Secret")
        if secret != settings.create_tenant_secret.get_secret_value():
            raise HTTPException(status_code=403, detail="Missing or invalid X-Create-Tenant-Secret")
    data = TenantCreate(code=body.code, name=body.name, status=body.status)
    created = await tenant_svc.create_tenant(data)
    return _to_response(created)


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
