"""Card replacement reasons API. Requires X-Tenant-ID."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.api.v1.dependencies import get_card_replacement_reason_service
from app.application.dtos.card_replacement import (
    CardReplacementReasonCreate,
    CardReplacementReasonUpdate,
)
from app.application.use_cases.card_replacement_reasons import (
    CardReplacementReasonService,
)
from app.schemas.card_replacement import (
    CardReplacementReasonCreateRequest,
    CardReplacementReasonResponse,
    CardReplacementReasonUpdateRequest,
)

router = APIRouter()


def _to_response(r) -> CardReplacementReasonResponse:
    return CardReplacementReasonResponse(
        id=r.id,
        tenant_id=r.tenant_id,
        name=r.name,
        code=r.code,
        status=r.status,
    )


@router.post("", response_model=CardReplacementReasonResponse, status_code=201)
async def create_reason(
    body: CardReplacementReasonCreateRequest,
    svc: Annotated[CardReplacementReasonService, Depends(get_card_replacement_reason_service)],
):
    data = CardReplacementReasonCreate(
        name=body.name,
        code=body.code,
        status=body.status,
    )
    created = await svc.create(data)
    return _to_response(created)


@router.get("", response_model=list[CardReplacementReasonResponse])
async def list_reasons(
    svc: Annotated[CardReplacementReasonService, Depends(get_card_replacement_reason_service)],
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    status: str | None = Query(None),
):
    items = await svc.list(skip=skip, limit=limit, status=status)
    return [_to_response(x) for x in items]


@router.get("/{entity_id}", response_model=CardReplacementReasonResponse)
async def get_reason(
    entity_id: str,
    svc: Annotated[CardReplacementReasonService, Depends(get_card_replacement_reason_service)],
):
    r = await svc.get_by_id(entity_id)
    return _to_response(r)


@router.patch("/{entity_id}", response_model=CardReplacementReasonResponse)
async def update_reason(
    entity_id: str,
    body: CardReplacementReasonUpdateRequest,
    svc: Annotated[CardReplacementReasonService, Depends(get_card_replacement_reason_service)],
):
    data = CardReplacementReasonUpdate(
        name=body.name,
        code=body.code,
        status=body.status,
    )
    updated = await svc.update(entity_id, data)
    return _to_response(updated)

