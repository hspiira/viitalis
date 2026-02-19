"""Catalog endpoints: medicines, services, labs, diagnoses. Requires X-Tenant-ID."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.api.v1.dependencies import (
    get_diagnosis_service,
    get_lab_service,
    get_medicine_service,
    get_services_service,
)
from app.application.dtos.catalog import CatalogItemCreate, CatalogItemUpdate
from app.application.use_cases.catalogs import CatalogService
from app.schemas.catalog import (
    CatalogItemCreateRequest,
    CatalogItemResponse,
    CatalogItemUpdateRequest,
)


def _catalog_router(get_svc):
    """Build a CRUD router for a catalog resource (DRY)."""
    router = APIRouter()

    @router.post("", response_model=CatalogItemResponse, status_code=201)
    async def create(
        body: CatalogItemCreateRequest,
        svc: Annotated[CatalogService, Depends(get_svc)],
    ):
        data = CatalogItemCreate(name=body.name, code=body.code)
        created = await svc.create(data)
        return CatalogItemResponse.model_validate(created)

    @router.get("", response_model=list[CatalogItemResponse])
    async def list_items(
        svc: Annotated[CatalogService, Depends(get_svc)],
        skip: int = Query(0, ge=0),
        limit: int = Query(100, ge=1, le=500),
    ):
        items = await svc.list_items(skip=skip, limit=limit)
        return [CatalogItemResponse.model_validate(x) for x in items]

    @router.get("/{item_id}", response_model=CatalogItemResponse)
    async def get_item(
        item_id: str,
        svc: Annotated[CatalogService, Depends(get_svc)],
    ):
        item = await svc.get_by_id(item_id)
        return CatalogItemResponse.model_validate(item)

    @router.patch("/{item_id}", response_model=CatalogItemResponse)
    async def update_item(
        item_id: str,
        body: CatalogItemUpdateRequest,
        svc: Annotated[CatalogService, Depends(get_svc)],
    ):
        data = CatalogItemUpdate(name=body.name, code=body.code)
        updated = await svc.update(item_id, data)
        return CatalogItemResponse.model_validate(updated)

    return router


medicines_router = _catalog_router(get_medicine_service)
services_router = _catalog_router(get_services_service)
labs_router = _catalog_router(get_lab_service)
diagnoses_router = _catalog_router(get_diagnosis_service)
