"""Tenant API: create, list, get by id."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.api.v1.dependencies import get_tenant_service
from app.application.dtos.tenant import TenantCreate
from app.application.use_cases.tenants import TenantService
from app.schemas.tenant import TenantCreateRequest, TenantListItem, TenantResponse

router = APIRouter()


@router.post("", response_model=TenantResponse, status_code=201)
async def create_tenant(
    body: TenantCreateRequest,
    tenant_svc: Annotated[TenantService, Depends(get_tenant_service)],
):
    """Create a tenant. Optionally gate with X-Create-Tenant-Secret in production."""
    data = TenantCreate(code=body.code, name=body.name, status=body.status)
    created = await tenant_svc.create_tenant(data)
    return TenantResponse(
        id=created.id, code=created.code, name=created.name, status=created.status
    )


@router.get("", response_model=list[TenantListItem])
async def list_tenants(
    tenant_svc: Annotated[TenantService, Depends(get_tenant_service)],
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
):
    """List tenants with pagination. Does not require X-Tenant-ID."""
    items = await tenant_svc.list_tenants(skip=skip, limit=limit)
    return [
        TenantListItem(id=t.id, code=t.code, name=t.name, status=t.status)
        for t in items
    ]


@router.get("/{tenant_id}", response_model=TenantResponse)
async def get_tenant(
    tenant_id: str,
    tenant_svc: Annotated[TenantService, Depends(get_tenant_service)],
):
    """Get tenant by ID. Does not require X-Tenant-ID."""
    tenant = await tenant_svc.get_by_id(tenant_id)
    return TenantResponse(
        id=tenant.id, code=tenant.code, name=tenant.name, status=tenant.status
    )
