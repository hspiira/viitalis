"""Pydantic schemas for hospital pricing API."""

from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class HospitalMedicineCreateRequest(BaseModel):
    medicine_id: str = Field(..., min_length=1, max_length=64)
    unit_price: Decimal = Field(..., ge=0)
    effective_date: date | None = None
    status: str = Field("active", max_length=32)


class HospitalMedicineResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    tenant_id: str
    hospital_id: str
    medicine_id: str
    unit_price: Decimal
    effective_date: date | None
    status: str


class HospitalServicePriceCreateRequest(BaseModel):
    service_id: str = Field(..., min_length=1, max_length=64)
    amount: Decimal = Field(..., ge=0)
    effective_date: date | None = None
    status: str = Field("active", max_length=32)


class HospitalServicePriceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    tenant_id: str
    hospital_id: str
    service_id: str
    amount: Decimal
    effective_date: date | None
    status: str


class HospitalLabTestCreateRequest(BaseModel):
    lab_id: str = Field(..., min_length=1, max_length=64)
    amount: Decimal = Field(..., ge=0)
    effective_date: date | None = None
    status: str = Field("active", max_length=32)


class HospitalLabTestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    tenant_id: str
    hospital_id: str
    lab_id: str
    amount: Decimal
    effective_date: date | None
    status: str
