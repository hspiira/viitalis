"""Claim service: create (with details), get, list, update, list_details. Tenant-scoped."""

from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import TYPE_CHECKING

from app.application.dtos.claim import (
    ClaimCreate,
    ClaimDetailCreate,
    ClaimDetailResult,
    ClaimResult,
    ClaimUpdate,
)
from app.domain.exceptions import ResourceNotFoundException, ValidationException

if TYPE_CHECKING:
    from app.application.interfaces.repositories import (
        IClaimRepository,
        IMemberRepository,
        ISchemeRepository,
    )


def _scheme_valid_at_date(
    begin_date: date | None,
    end_date: date | None,
    termination_date: date | None,
    service_date: date,
) -> bool:
    """True if scheme is active for service_date."""
    if begin_date is not None and service_date < begin_date:
        return False
    if end_date is not None and service_date > end_date:
        return False
    if termination_date is not None and service_date >= termination_date:
        return False
    return True


_PRICE_TOLERANCE = Decimal("0.01")


class ClaimService:
    def __init__(
        self,
        claim_repo: IClaimRepository,
        member_repo: IMemberRepository,
        scheme_repo: ISchemeRepository,
        hospital_pricing_repo=None,
    ) -> None:
        self.claim_repo = claim_repo
        self.member_repo = member_repo
        self.scheme_repo = scheme_repo
        self.hospital_pricing_repo = hospital_pricing_repo

    async def create_claim(
        self, data: ClaimCreate, details: list[ClaimDetailCreate]
    ) -> ClaimResult:
        if not data.member_id or not data.member_id.strip():
            raise ValidationException("Member is required", field="member_id")
        if not data.hospital_id or not data.hospital_id.strip():
            raise ValidationException("Hospital is required", field="hospital_id")
        if not data.service_date:
            raise ValidationException("Service date is required", field="service_date")
        if data.service_date > date.today():
            raise ValidationException(
                "Service date cannot be in the future", field="service_date"
            )

        member = await self.member_repo.get_by_id(data.member_id)
        if not member:
            raise ValidationException("Member not found", field="member_id")
        scheme = await self.scheme_repo.get_by_id(member.scheme_id)
        if not scheme:
            raise ValidationException("Scheme not found for member", field="scheme_id")
        if not _scheme_valid_at_date(
            scheme.begin_date,
            scheme.end_date,
            scheme.termination_date,
            data.service_date,
        ):
            raise ValidationException(
                "Scheme is not active for the service date",
                field="service_date",
            )

        if data.invoice_number and data.invoice_number.strip():
            if await self.claim_repo.exists_by_invoice_and_hospital(
                data.invoice_number, data.hospital_id
            ):
                raise ValidationException(
                    "A claim already exists for this invoice number at this hospital",
                    field="invoice_number",
                )

        if self.hospital_pricing_repo:
            for i, d in enumerate(details):
                if d.item_type and d.fee_code and d.item_type in ("medicine", "service", "lab"):
                    agreed = await self.hospital_pricing_repo.get_agreed_unit_price(
                        data.hospital_id, d.item_type, d.fee_code
                    )
                    if agreed is not None and abs(Decimal(d.unit_price) - agreed) > _PRICE_TOLERANCE:
                        raise ValidationException(
                            f"Unit price for {d.fee_code} does not match hospital agreed price",
                            field=f"details[{i}].unit_price",
                        )

        return await self.claim_repo.create_with_details(data, details)

    async def get_by_id(self, claim_id: str) -> ClaimResult:
        claim = await self.claim_repo.get_by_id(claim_id)
        if not claim:
            raise ResourceNotFoundException("Claim not found")
        return claim

    async def list_claims(
        self,
        skip: int = 0,
        limit: int = 100,
        member_id: str | None = None,
        status: str | None = None,
        hospital_id: str | None = None,
        company_id: str | None = None,
        service_date_from: date | None = None,
        service_date_to: date | None = None,
    ) -> list[ClaimResult]:
        return await self.claim_repo.list_by_tenant(
            skip=skip,
            limit=limit,
            member_id=member_id,
            status=status,
            hospital_id=hospital_id,
            company_id=company_id,
            service_date_from=service_date_from,
            service_date_to=service_date_to,
        )

    async def update_claim(self, claim_id: str, data: ClaimUpdate) -> ClaimResult:
        updated = await self.claim_repo.update(claim_id, data)
        if not updated:
            raise ResourceNotFoundException("Claim not found")
        return updated

    async def list_details(self, claim_id: str) -> list[ClaimDetailResult]:
        await self.get_by_id(claim_id)  # ensure claim exists and tenant-scoped
        return await self.claim_repo.list_details(claim_id)

    async def update_approval(
        self,
        claim_id: str,
        approved: bool,
        approved_by: str | None = None,
        comments: str | None = None,
    ) -> ClaimResult:
        updated = await self.claim_repo.update_approval(
            claim_id, approved=approved, approved_by=approved_by, comments=comments
        )
        if not updated:
            raise ResourceNotFoundException("Claim not found")
        return updated

    async def bulk_approve(
        self,
        claim_ids: list[str],
        approved: bool,
        approved_by: str | None = None,
        comments: str | None = None,
    ) -> int:
        return await self.claim_repo.bulk_approve(
            claim_ids, approved=approved, approved_by=approved_by, comments=comments
        )
