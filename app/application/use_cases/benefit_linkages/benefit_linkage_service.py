"""Benefit linkage service: list by benefit, add (with duplicate check), delete. Tenant-scoped."""

from app.application.dtos.benefit import BenefitLinkageCreate, BenefitLinkageResult
from app.domain.exceptions import ResourceNotFoundException, ValidationException
from app.infrastructure.persistence.repositories.benefit_linkage_repo import (
    BenefitLinkageRepository,
)
from app.infrastructure.persistence.repositories.benefit_repo import BenefitRepository


class BenefitLinkageService:
    def __init__(
        self,
        linkage_repo: BenefitLinkageRepository,
        benefit_repo: BenefitRepository,
    ) -> None:
        self.linkage_repo = linkage_repo
        self.benefit_repo = benefit_repo

    async def list_by_benefit(
        self, benefit_id: str, skip: int = 0, limit: int = 100
    ) -> list[BenefitLinkageResult]:
        await self._ensure_benefit_exists(benefit_id)
        return await self.linkage_repo.list_by_benefit(
            benefit_id, skip=skip, limit=limit
        )

    async def create_linkage(
        self, benefit_id: str, data: BenefitLinkageCreate
    ) -> BenefitLinkageResult:
        await self._ensure_benefit_exists(benefit_id)
        if data.benefit_id != benefit_id:
            raise ValidationException(
                "benefit_id in body must match path",
                field="benefit_id",
            )
        if data.service_type not in ("medicine", "service", "lab", "diagnosis"):
            raise ValidationException(
                "service_type must be one of: medicine, service, lab, diagnosis",
                field="service_type",
            )
        if await self.linkage_repo.exists_linkage(
            benefit_id, data.service_type, data.catalog_item_id
        ):
            raise ValidationException(
                "This benefit already has a linkage for this service type and catalog item",
                field="catalog_item_id",
            )
        return await self.linkage_repo.create(data)

    async def get_linkage(self, linkage_id: str) -> BenefitLinkageResult:
        l = await self.linkage_repo.get_by_id(linkage_id)
        if not l:
            raise ResourceNotFoundException("Benefit linkage not found")
        return l

    async def delete_linkage(self, linkage_id: str) -> None:
        await self.get_linkage(linkage_id)
        ok = await self.linkage_repo.delete(linkage_id)
        if not ok:
            raise ResourceNotFoundException("Benefit linkage not found")

    async def _ensure_benefit_exists(self, benefit_id: str) -> None:
        b = await self.benefit_repo.get_by_id(benefit_id)
        if not b:
            raise ResourceNotFoundException("Benefit not found")
