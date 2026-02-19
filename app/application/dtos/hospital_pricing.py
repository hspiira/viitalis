"""DTOs for hospital-specific pricing (medicine, service, lab)."""

from dataclasses import dataclass
from datetime import date
from decimal import Decimal


@dataclass
class HospitalMedicineResult:
    id: str
    tenant_id: str
    hospital_id: str
    medicine_id: str
    unit_price: Decimal
    effective_date: date | None
    status: str


@dataclass
class HospitalMedicineCreate:
    hospital_id: str
    medicine_id: str
    unit_price: Decimal
    effective_date: date | None = None
    status: str = "active"


@dataclass
class HospitalServicePriceResult:
    id: str
    tenant_id: str
    hospital_id: str
    service_id: str
    amount: Decimal
    effective_date: date | None
    status: str


@dataclass
class HospitalServicePriceCreate:
    hospital_id: str
    service_id: str
    amount: Decimal
    effective_date: date | None = None
    status: str = "active"


@dataclass
class HospitalLabTestResult:
    id: str
    tenant_id: str
    hospital_id: str
    lab_id: str
    amount: Decimal
    effective_date: date | None
    status: str


@dataclass
class HospitalLabTestCreate:
    hospital_id: str
    lab_id: str
    amount: Decimal
    effective_date: date | None = None
    status: str = "active"
