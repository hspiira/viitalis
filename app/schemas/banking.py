"""Pydantic schemas for banking APIs."""

from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


# --- Bank ---
class BankCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    code: str | None = Field(None, max_length=64)
    status: str = Field("active", max_length=32)


class BankUpdateRequest(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    code: str | None = Field(None, max_length=64)
    status: str | None = Field(None, max_length=32)


class BankResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    tenant_id: str
    name: str
    code: str | None
    status: str


# --- BankBranch ---
class BankBranchCreateRequest(BaseModel):
    bank_id: str = Field(..., min_length=1, max_length=64)
    name: str = Field(..., min_length=1, max_length=255)
    address: str | None = None
    status: str = Field("active", max_length=32)


class BankBranchUpdateRequest(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    address: str | None = None
    status: str | None = Field(None, max_length=32)


class BankBranchResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    tenant_id: str
    bank_id: str
    name: str
    address: str | None
    status: str


# --- AccountDetail ---
class AccountDetailCreateRequest(BaseModel):
    member_id: str | None = Field(None, max_length=64)
    hospital_id: str | None = Field(None, max_length=64)
    account_type: str = Field("member", pattern="^(member|hospital)$")
    balance: Decimal = Field(default=Decimal("0"))
    virtual_balance: Decimal = Field(default=Decimal("0"))
    currency: str = Field("USD", max_length=8)
    status: str = Field("active", max_length=32)


class AccountDetailUpdateRequest(BaseModel):
    balance: Decimal | None = None
    virtual_balance: Decimal | None = None
    currency: str | None = Field(None, max_length=8)
    status: str | None = Field(None, max_length=32)


class AccountDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    tenant_id: str
    member_id: str | None
    hospital_id: str | None
    account_type: str
    balance: Decimal
    virtual_balance: Decimal
    currency: str
    status: str


# --- BankAccountDetail ---
class BankAccountDetailCreateRequest(BaseModel):
    account_detail_id: str = Field(..., min_length=1, max_length=64)
    bank_id: str = Field(..., min_length=1, max_length=64)
    bank_branch_id: str | None = Field(None, max_length=64)
    account_number: str = Field(..., min_length=1, max_length=64)
    status: str = Field("active", max_length=32)


class BankAccountDetailUpdateRequest(BaseModel):
    bank_branch_id: str | None = Field(None, max_length=64)
    account_number: str | None = Field(None, max_length=64)
    status: str | None = Field(None, max_length=32)


class BankAccountDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    tenant_id: str
    account_detail_id: str
    bank_id: str
    bank_branch_id: str | None
    account_number: str
    status: str
