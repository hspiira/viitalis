"""App modules API: list modules (global). No tenant."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.api.v1.dependencies import get_app_module_service
from app.application.use_cases.app_modules import AppModuleService
from app.schemas.auth import AppModuleResponse

router = APIRouter()


@router.get("", response_model=list[AppModuleResponse])
async def list_app_modules(
    svc: Annotated[AppModuleService, Depends(get_app_module_service)],
    skip: int = Query(0, ge=0),
    limit: int = Query(200, ge=1, le=500),
    status: str | None = Query("active"),
):
    """List application modules (global lookup). Optional status filter."""
    items = await svc.list_all(skip=skip, limit=limit, status=status)
    return [
        AppModuleResponse(
            id=m.id,
            code=m.code,
            name=m.name,
            parent_id=m.parent_id,
            module_order=m.module_order,
            status=m.status,
        )
        for m in items
    ]
