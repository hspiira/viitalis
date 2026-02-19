"""Pydantic schemas for catalog API (Medicine, Service, Lab, Diagnosis)."""

from pydantic import BaseModel, Field


class CatalogItemCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    code: str | None = Field(None, max_length=64)


class CatalogItemUpdateRequest(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    code: str | None = Field(None, max_length=64)


class CatalogItemResponse(BaseModel):
    id: str
    tenant_id: str
    name: str
    code: str | None


class CatalogUploadRow(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    code: str | None = Field(None, max_length=64)


class CatalogUploadRequest(BaseModel):
    items: list[CatalogUploadRow] = Field(..., min_length=1, max_length=500)


class CatalogUploadErrorItem(BaseModel):
    row: int
    message: str


class CatalogUploadResponse(BaseModel):
    created: int
    failed: int
    errors: list[CatalogUploadErrorItem] = []
