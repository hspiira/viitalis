#!/usr/bin/env python3
"""
Bulk import companies from docs/data/Comps.csv into the new system via API.

Requires: requests (pip install requests)

Usage:
  export VITALIS_API_URL="http://localhost:8000/api/v1"  # or your API base
  export VITALIS_TOKEN="<your JWT>"
  export VITALIS_TENANT_ID="<tenant id>"
  python scripts/import_companies_from_csv.py [path/to/Comps.csv]

If CSV path is omitted, defaults to docs/data/Comps.csv (from repo root).
"""

from __future__ import annotations

import csv
import json
import os
import sys
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError


def _env(key: str, default: str | None = None) -> str:
    v = os.environ.get(key, default)
    if v is None or v == "":
        raise SystemExit(f"Missing env: {key}")
    return v


def _clean(s: str | None) -> str | None:
    if s is None:
        return None
    s = s.strip()
    if s in ("", "-"):
        return None
    return s


def _int_or_none(s: str | None) -> int | None:
    if s is None:
        return None
    s = s.strip()
    if s in ("", "-"):
        return None
    try:
        return int(s)
    except ValueError:
        return None


def _status_from_current_update(s: str | None) -> str:
    """Map CURRENTUPDATE (TRUE/FALSE) to status (active/inactive)."""
    if s is None:
        return "active"
    v = s.strip().upper()
    if v == "TRUE" or v == "1":
        return "active"
    return "inactive"


def row_to_payload(row: dict[str, str]) -> dict:
    """Map one CSV row (Comps.csv columns) to POST /companies body."""
    name = _clean(row.get("COMPANY_NAME"))
    if not name:
        raise ValueError("COMPANY_NAME is required")
    address = _clean(row.get("COMPANY_ADDRESS"))
    contact_person = _clean(row.get("CONTACT_PERSON"))
    phone = _clean(row.get("PHONE_NUMBER"))
    email = _clean(row.get("EMAIL"))
    website = _clean(row.get("WEBSITE"))
    remarks = _clean(row.get("REMARKS"))
    location = _clean(row.get("LOCATION"))
    district_id = _int_or_none(row.get("DISTRICT_ID"))
    company_type = _int_or_none(row.get("COMPANY_TYPE"))
    code = _clean(row.get("COMPANY_CODE"))  # used as id
    status = _status_from_current_update(row.get("CURRENTUPDATE"))

    payload = {
        "name": name,
        "contact_person": contact_person,
        "address": address,
        "phone": phone,
        "email": email,
        "website": website,
        "remarks": remarks,
        "location": location,
        "district_id": district_id,
        "company_type": company_type,
        "status": status,
    }
    if code and len(code) <= 64:
        payload["id"] = code
    return payload


def main() -> None:
    repo_root = Path(__file__).resolve().parent.parent
    csv_path = Path(sys.argv[1]) if len(sys.argv) > 1 else repo_root / "docs" / "data" / "Comps.csv"
    if not csv_path.is_file():
        raise SystemExit(f"CSV not found: {csv_path}")

    base_url = _env("VITALIS_API_URL").rstrip("/")
    token = _env("VITALIS_TOKEN")
    tenant_id = _env("VITALIS_TENANT_ID")

    url = f"{base_url}/companies"
    created = 0
    failed = 0
    with open(csv_path, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader):
            # Normalize keys (strip quotes and spaces from CSV header)
            row = {k.strip().strip('"'): (v or "").strip().strip('"') for k, v in row.items()}
            try:
                payload = row_to_payload(row)
            except ValueError as e:
                print(f"Row {i + 2}: skip - {e}")
                failed += 1
                continue
            body = json.dumps(payload).encode("utf-8")
            req = Request(
                url,
                data=body,
                method="POST",
                headers={
                    "Authorization": f"Bearer {token}",
                    "X-Tenant-ID": tenant_id,
                    "Content-Type": "application/json",
                },
            )
            try:
                with urlopen(req, timeout=30) as resp:
                    if resp.status in (200, 201):
                        created += 1
                        print(f"Created: {payload['name'][:50]}")
                    else:
                        failed += 1
                        print(f"FAIL Row {i + 2}: {resp.status}")
            except HTTPError as e:
                failed += 1
                msg = e.read().decode("utf-8", errors="replace")[:200]
                print(f"FAIL Row {i + 2}: {e.code} - {msg}")

    print(f"\nDone. Created: {created}, Failed: {failed}")


if __name__ == "__main__":
    main()
