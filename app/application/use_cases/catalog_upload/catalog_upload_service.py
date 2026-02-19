"""Bulk upload for catalog items (medicines, services, labs). Skip duplicates by code."""

from app.application.dtos.catalog import CatalogItemCreate
from app.infrastructure.persistence.repositories.catalog_repo import (
    MedicineRepository,
)


MAX_UPLOAD_BATCH = 500


class CatalogUploadService:
    """Bulk upload medicines (or other catalogs). Conflict policy: skip duplicate code."""

    def __init__(self, medicine_repo: MedicineRepository) -> None:
        self.repo = medicine_repo

    async def upload_medicines(
        self,
        items: list[CatalogItemCreate],
    ) -> tuple[int, int, list[tuple[int, str]]]:
        """
        Create medicines in batch. Skips rows with duplicate code (same tenant).
        Returns (created_count, failed_count, errors) where errors is (row_index, message).
        """
        if len(items) > MAX_UPLOAD_BATCH:
            return (
                0,
                len(items),
                [(0, f"Batch size exceeds maximum {MAX_UPLOAD_BATCH}")],
            )
        created = 0
        errors: list[tuple[int, str]] = []
        for i, data in enumerate(items):
            if not data.name or not data.name.strip():
                errors.append((i, "Name is required"))
                continue
            if data.code and (await self.repo.exists_by_code(data.code.strip())):
                errors.append((i, f"Duplicate code: {data.code}"))
                continue
            try:
                await self.repo.create(data)
                created += 1
            except Exception as e:
                errors.append((i, str(e)))
        return (created, len(errors), errors)
