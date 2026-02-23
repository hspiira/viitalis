"""Import members in batch. Validate company_id, scheme_id, card_no uniqueness."""

import logging

from sqlalchemy.exc import IntegrityError

from app.application.dtos.member import MemberCreate, MemberResult
from app.infrastructure.persistence.repositories.company_repo import CompanyRepository
from app.infrastructure.persistence.repositories.member_repo import MemberRepository
from app.infrastructure.persistence.repositories.scheme_repo import SchemeRepository

logger = logging.getLogger(__name__)

MAX_IMPORT_BATCH = 500
GENERIC_ROW_ERROR = "Row failed validation or duplicate data"


class ImportMembersService:
    def __init__(
        self,
        member_repo: MemberRepository,
        company_repo: CompanyRepository,
        scheme_repo: SchemeRepository,
    ) -> None:
        self.member_repo = member_repo
        self.company_repo = company_repo
        self.scheme_repo = scheme_repo

    async def import_members(
        self,
        items: list[MemberCreate],
    ) -> tuple[int, int, list[tuple[int, str]]]:
        """
        Create members in batch. Validates each row (company exists, scheme exists, card_no unique).
        Returns (created_count, failed_count, errors) where errors is list of (row_index, message).
        """
        if len(items) > MAX_IMPORT_BATCH:
            return (
                0,
                len(items),
                [(0, f"Batch size exceeds maximum {MAX_IMPORT_BATCH}")],
            )
        created = 0
        errors: list[tuple[int, str]] = []
        for i, data in enumerate(items):
            err = await self._validate_row(data)
            if err:
                errors.append((i, err))
                continue
            try:
                await self.member_repo.create(data)
                created += 1
            except IntegrityError:
                logger.exception("Import member row %s: integrity error", i)
                errors.append((i, GENERIC_ROW_ERROR))
            except (ValueError, TypeError) as e:
                logger.exception("Import member row %s: validation error", i)
                errors.append((i, GENERIC_ROW_ERROR))
            except Exception as e:
                logger.exception("Import member row %s: unexpected error", i)
                errors.append((i, GENERIC_ROW_ERROR))
        failed = len(errors)
        return (created, failed, errors)

    async def _validate_row(self, data: MemberCreate) -> str | None:
        if not data.name or not data.name.strip():
            return "Member name is required"
        if not data.company_id or not data.company_id.strip():
            return "company_id is required"
        if not data.scheme_id or not data.scheme_id.strip():
            return "scheme_id is required"
        if not data.card_no or not data.card_no.strip():
            return "card_no is required"
        company = await self.company_repo.get_by_id(data.company_id)
        if not company:
            return f"Company not found: {data.company_id}"
        scheme = await self.scheme_repo.get_by_id(data.scheme_id)
        if not scheme:
            return f"Scheme not found: {data.scheme_id}"
        if await self.member_repo.exists_by_card_no(data.card_no):
            return f"Card number already in use: {data.card_no}"
        return None
