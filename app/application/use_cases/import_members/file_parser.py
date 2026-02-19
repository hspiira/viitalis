"""Parse CSV and Excel files into member import rows. Headers: company_id, scheme_id, card_no, name, dob, status."""

import csv
from datetime import date
from io import BytesIO
from typing import Any

from openpyxl import load_workbook

from app.application.dtos.member import MemberCreate



def _normalize_header(h: str) -> str:
    return (h or "").strip().lower().replace(" ", "_").replace("-", "_")


def _parse_dob(value: Any) -> date | None:
    if value is None or (isinstance(value, str) and not value.strip()):
        return None
    if isinstance(value, date):
        return value
    if isinstance(value, str):
        try:
            return date.fromisoformat(value.strip()[:10])
        except ValueError:
            return None
    return None


def _row_to_member_create(row: dict[str, Any]) -> tuple[MemberCreate | None, str | None]:
    """Convert a dict of column->value to MemberCreate. Returns (data, error_message)."""
    def get(key: str) -> str:
        v = row.get(key) or row.get(key.replace("_", " ")) or ""
        return str(v).strip() if v is not None else ""

    company_id = get("company_id")
    scheme_id = get("scheme_id")
    card_no = get("card_no")
    name = get("name")
    if not name:
        return None, "name is required"
    if not company_id:
        return None, "company_id is required"
    if not scheme_id:
        return None, "scheme_id is required"
    if not card_no:
        return None, "card_no is required"

    dob = _parse_dob(row.get("dob"))
    status = (get("status") or "active").strip() or "active"

    return (
        MemberCreate(
            company_id=company_id,
            scheme_id=scheme_id,
            card_no=card_no,
            name=name,
            dob=dob,
            status=status[:32],
        ),
        None,
    )


def parse_csv(content: bytes) -> tuple[list[MemberCreate], list[int], list[tuple[int, str]]]:
    """
    Parse CSV bytes (first row = headers). Column names normalized (lowercase, spaces->underscores).
    Returns (items, file_row_for_item, parse_errors).
    - items: valid MemberCreate list
    - file_row_for_item: 1-based file row index for each item (so errors can reference file row)
    - parse_errors: (row_1based, message) for rows that failed parsing
    """
    reader = csv.DictReader(BytesIO(content).read().decode("utf-8-sig").splitlines())
    fieldnames = reader.fieldnames or []
    normalized = {_normalize_header(h) for h in fieldnames}
    required = {"company_id", "scheme_id", "card_no", "name"}
    missing = required - normalized
    if missing:
        return [], [], [(1, f"Missing required columns: {', '.join(sorted(missing))}")]

    items: list[MemberCreate] = []
    file_row_for_item: list[int] = []
    errors: list[tuple[int, str]] = []
    for i, raw_row in enumerate(reader):
        row = {}
        for orig, val in raw_row.items():
            norm = _normalize_header(orig)
            if norm:
                row[norm] = val
        create, err = _row_to_member_create(row)
        if err:
            errors.append((i + 2, err))  # 1-based + header row
        elif create:
            items.append(create)
            file_row_for_item.append(i + 2)
    return items, file_row_for_item, errors


def parse_excel(content: bytes) -> tuple[list[MemberCreate], list[int], list[tuple[int, str]]]:
    """
    Parse first sheet of xlsx. First row = headers. Returns (items, file_row_for_item, parse_errors).
    """
    wb = load_workbook(filename=BytesIO(content), read_only=True, data_only=True)
    sheet = wb.active
    if not sheet:
        wb.close()
        return [], [], [(1, "Workbook has no active sheet")]
    rows_iter = sheet.iter_rows(values_only=True)
    header_row = next(rows_iter, None)
    if not header_row:
        wb.close()
        return [], [], [(1, "Sheet is empty")]
    headers = [_normalize_header(str(h)) for h in header_row]
    col_index: dict[str, int] = {h: i for i, h in enumerate(headers) if h}
    required = {"company_id", "scheme_id", "card_no", "name"}
    missing = required - set(col_index)
    if missing:
        wb.close()
        return [], [], [(1, f"Missing required columns: {', '.join(sorted(missing))}")]

    items: list[MemberCreate] = []
    file_row_for_item: list[int] = []
    errors: list[tuple[int, str]] = []
    for row_index, row_tuple in enumerate(rows_iter):
        row = {h: (row_tuple[col_index[h]] if col_index[h] < len(row_tuple) else None) for h in col_index}
        create, err = _row_to_member_create(row)
        if err:
            errors.append((row_index + 2, err))  # 1-based + header row
        elif create:
            items.append(create)
            file_row_for_item.append(row_index + 2)
    wb.close()
    return items, file_row_for_item, errors
