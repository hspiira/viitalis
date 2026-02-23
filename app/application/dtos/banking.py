"""DTOs for banking: bank, bank_branch, account_detail, bank_account_detail."""

from dataclasses import dataclass
from decimal import Decimal


# --- Bank ---
@dataclass
class BankResult:
    id: str
    tenant_id: str
    name: str
    code: str | None
    status: str


@dataclass
class BankCreate:
    name: str
    code: str | None = None
    status: str = "active"


@dataclass
class BankUpdate:
    name: str | None = None
    code: str | None = None
    status: str | None = None


# --- BankBranch ---
@dataclass
class BankBranchResult:
    id: str
    tenant_id: str
    bank_id: str
    name: str
    address: str | None
    status: str


@dataclass
class BankBranchCreate:
    bank_id: str
    name: str
    address: str | None = None
    status: str = "active"


@dataclass
class BankBranchUpdate:
    name: str | None = None
    address: str | None = None
    status: str | None = None


# --- AccountDetail ---
@dataclass
class AccountDetailResult:
    id: str
    tenant_id: str
    member_id: str | None
    hospital_id: str | None
    account_type: str
    balance: Decimal
    virtual_balance: Decimal
    currency: str
    status: str


@dataclass
class AccountDetailCreate:
    member_id: str | None = None
    hospital_id: str | None = None
    account_type: str = "member"  # member | hospital
    balance: Decimal = Decimal("0")
    virtual_balance: Decimal = Decimal("0")
    currency: str = "USD"
    status: str = "active"


@dataclass
class AccountDetailUpdate:
    balance: Decimal | None = None
    virtual_balance: Decimal | None = None
    currency: str | None = None
    status: str | None = None


# --- BankAccountDetail ---
@dataclass
class BankAccountDetailResult:
    id: str
    tenant_id: str
    account_detail_id: str
    bank_id: str
    bank_branch_id: str | None
    account_number: str
    status: str


@dataclass
class BankAccountDetailCreate:
    account_detail_id: str
    bank_id: str
    bank_branch_id: str | None = None
    account_number: str = ""
    status: str = "active"


@dataclass
class BankAccountDetailUpdate:
    bank_branch_id: str | None = None
    account_number: str | None = None
    status: str | None = None
