"""Card replacements API. Requires X-Tenant-ID."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.api.v1.dependencies import get_card_replacement_service
from app.application.dtos.card_replacement import CardReplacementCreate
from app.application.use_cases.card_replacements import CardReplacementService
from app.schemas.card_replacement import (
    CardReplacementCreateRequest,
    CardReplacementResponse,
)

router = APIRouter()


def _to_response(r) -> CardReplacementResponse:
    return CardReplacementResponse(
        id=r.id,
        tenant_id=r.tenant_id,
        member_id=r.member_id,
        dependant_id=r.dependant_id,
        reason_id=r.reason_id,
        old_card_no=r.old_card_no,
        new_card_no=r.new_card_no,
        requested_at=r.requested_at,
        status=r.status,
    )


@router.post("", response_model=CardReplacementResponse, status_code=201)
async def create_card_replacement(
    body: CardReplacementCreateRequest,
    svc: Annotated[CardReplacementService, Depends(get_card_replacement_service)],
):
    data = CardReplacementCreate(
        member_id=body.member_id,
        dependant_id=body.dependant_id,
        reason_id=body.reason_id,
        old_card_no=body.old_card_no,
        new_card_no=body.new_card_no,
        status=body.status,
    )
    created = await svc.create(data)
    return _to_response(created)


@router.get("", response_model=list[CardReplacementResponse])
async def list_card_replacements(
    svc: Annotated[CardReplacementService, Depends(get_card_replacement_service)],
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    member_id: str | None = Query(None),
    dependant_id: str | None = Query(None),
    status: str | None = Query(None),
):
    items = await svc.list(
        skip=skip,
        limit=limit,
        member_id=member_id,
        dependant_id=dependant_id,
        status=status,
    )
    return [_to_response(x) for x in items]


@router.get("/{entity_id}", response_model=CardReplacementResponse)
async def get_card_replacement(
    entity_id: str,
    svc: Annotated[CardReplacementService, Depends(get_card_replacement_service)],
):
    r = await svc.get_by_id(entity_id)
    return _to_response(r)
