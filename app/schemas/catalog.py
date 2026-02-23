"""Pydantic schemas for catalog API (Medicine, Service, Lab, Diagnosis)."""

from pydantic import BaseModel, ConfigDict, Field


class CatalogItemCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    code: str | None = Field(None, max_length=64)
    remarks: str | None = Field(None, max_length=500)


class CatalogItemUpdateRequest(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    code: str | None = Field(None, max_length=64)
    remarks: str | None = Field(None, max_length=500)


class CatalogItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    tenant_id: str
    name: str
    code: str | None
    remarks: str | None = None


class CatalogUploadRow(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    code: str | None = Field(None, max_length=64)
    remarks: str | None = Field(None, max_length=500)


class CatalogUploadRequest(BaseModel):
    items: list[CatalogUploadRow] = Field(..., min_length=1, max_length=500)


class CatalogUploadErrorItem(BaseModel):
    row: int
    message: str


class CatalogUploadResponse(BaseModel):
    created: int
    failed: int
    errors: list[CatalogUploadErrorItem] = []
