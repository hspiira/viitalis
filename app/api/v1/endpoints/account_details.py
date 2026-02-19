"""Account details API. Requires X-Tenant-ID."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.api.v1.dependencies import (
    get_account_detail_service,
    get_bank_account_detail_service,
)
from app.application.dtos.banking import (
    AccountDetailCreate,
    AccountDetailUpdate,
    BankAccountDetailCreate,
    BankAccountDetailUpdate,
)
from app.application.use_cases.account_details import AccountDetailService
from app.application.use_cases.bank_account_details import BankAccountDetailService
from app.schemas.banking import (
    AccountDetailCreateRequest,
    AccountDetailResponse,
    AccountDetailUpdateRequest,
    BankAccountDetailCreateRequest,
    BankAccountDetailResponse,
    BankAccountDetailUpdateRequest,
)

router = APIRouter()


def _account_to_response(r) -> AccountDetailResponse:
    """Map AccountDetailResult DTO to API response (DRY)."""
    return AccountDetailResponse.model_validate(r)


def _bank_account_to_response(r) -> BankAccountDetailResponse:
    """Map BankAccountDetailResult DTO to API response (DRY)."""
    return BankAccountDetailResponse.model_validate(r)


# --- Account details ---
@router.post("", response_model=AccountDetailResponse, status_code=201)
async def create_account_detail(
    body: AccountDetailCreateRequest,
    svc: Annotated[AccountDetailService, Depends(get_account_detail_service)],
):
    data = AccountDetailCreate(
        member_id=body.member_id,
        hospital_id=body.hospital_id,
        account_type=body.account_type,
        balance=body.balance,
        virtual_balance=body.virtual_balance,
        currency=body.currency,
        status=body.status,
    )
    created = await svc.create(data)
    return _account_to_response(created)


@router.get("", response_model=list[AccountDetailResponse])
async def list_account_details(
    svc: Annotated[AccountDetailService, Depends(get_account_detail_service)],
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    member_id: str | None = Query(None),
    hospital_id: str | None = Query(None),
    status: str | None = Query(None),
):
    items = await svc.list(
        skip=skip,
        limit=limit,
        member_id=member_id,
        hospital_id=hospital_id,
        status=status,
    )
    return [_account_to_response(x) for x in items]


@router.get("/{account_id}", response_model=AccountDetailResponse)
async def get_account_detail(
    account_id: str,
    svc: Annotated[AccountDetailService, Depends(get_account_detail_service)],
):
    r = await svc.get_by_id(account_id)
    return _account_to_response(r)


@router.patch("/{account_id}", response_model=AccountDetailResponse)
async def update_account_detail(
    account_id: str,
    body: AccountDetailUpdateRequest,
    svc: Annotated[AccountDetailService, Depends(get_account_detail_service)],
):
    data = AccountDetailUpdate(
        balance=body.balance,
        virtual_balance=body.virtual_balance,
        currency=body.currency,
        status=body.status,
    )
    updated = await svc.update(account_id, data)
    return _account_to_response(updated)


# --- Bank account details (under /account-details/{account_id}/bank-accounts) ---
@router.get(
    "/{account_id}/bank-accounts",
    response_model=list[BankAccountDetailResponse],
)
async def list_bank_account_details(
    account_id: str,
    svc: Annotated[BankAccountDetailService, Depends(get_bank_account_detail_service)],
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
):
    items = await svc.list_by_account_detail(
        account_id, skip=skip, limit=limit
    )
    return [_bank_account_to_response(x) for x in items]


@router.post(
    "/{account_id}/bank-accounts",
    response_model=BankAccountDetailResponse,
    status_code=201,
)
async def create_bank_account_detail(
    account_id: str,
    body: BankAccountDetailCreateRequest,
    svc: Annotated[BankAccountDetailService, Depends(get_bank_account_detail_service)],
):
    data = BankAccountDetailCreate(
        account_detail_id=account_id,
        bank_id=body.bank_id,
        bank_branch_id=body.bank_branch_id,
        account_number=body.account_number,
        status=body.status,
    )
    created = await svc.create(data)
    return _bank_account_to_response(created)


@router.get(
    "/{account_id}/bank-accounts/{bank_account_id}",
    response_model=BankAccountDetailResponse,
)
async def get_bank_account_detail(
    account_id: str,
    bank_account_id: str,
    svc: Annotated[BankAccountDetailService, Depends(get_bank_account_detail_service)],
):
    r = await svc.get_by_id(bank_account_id)
    return _bank_account_to_response(r)


@router.patch(
    "/{account_id}/bank-accounts/{bank_account_id}",
    response_model=BankAccountDetailResponse,
)
async def update_bank_account_detail(
    account_id: str,
    bank_account_id: str,
    body: BankAccountDetailUpdateRequest,
    svc: Annotated[BankAccountDetailService, Depends(get_bank_account_detail_service)],
):
    data = BankAccountDetailUpdate(
        bank_branch_id=body.bank_branch_id,
        account_number=body.account_number,
        status=body.status,
    )
    updated = await svc.update(bank_account_id, data)
    return _bank_account_to_response(updated)
