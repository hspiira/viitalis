"""Catalog DTOs (Medicine, Service, Lab, Diagnosis) - same shape."""

from dataclasses import dataclass


@dataclass
class CatalogItemResult:
    id: str
    tenant_id: str
    name: str
    code: str | None
    remarks: str | None = None


@dataclass
class CatalogItemCreate:
    name: str
    code: str | None = None
    remarks: str | None = None


@dataclass
class CatalogItemUpdate:
    name: str | None = None
    code: str | None = None
    remarks: str | None = None
