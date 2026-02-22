#!/usr/bin/env python3
"""
Bulk import hospital branches from docs/data/Hospital Branches.csv via API.

Skips the first 4 rows (already inserted). Resolves HOSPITAL_CODE to hospital id
via GET /hospitals (matches hospital.code or hospital.id).

Requires: requests (pip install requests)

Usage:
  export VITALIS_API_URL="http://localhost:8000/api/v1"
  export VITALIS_TOKEN="<your JWT>"
  export VITALIS_TENANT_ID="<tenant id>"
  python scripts/import_hospital_branches_from_csv.py [path/to/Hospital Branches.csv]

Optional:
  SKIP_FIRST_N=4  (default 4) number of rows to skip after header
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
    s = s.strip().strip('"')
    if s in ("", "-"):
        return None
    return s


def main() -> None:
    repo_root = Path(__file__).resolve().parent.parent
    csv_path = Path(sys.argv[1]) if len(sys.argv) > 1 else repo_root / "docs" / "data" / "Hospital Branches.csv"
    if not csv_path.is_file():
        raise SystemExit(f"CSV not found: {csv_path}")

    skip_first_n = int(os.environ.get("SKIP_FIRST_N", "4"))
    base_url = _env("VITALIS_API_URL").rstrip("/")
    token = _env("VITALIS_TOKEN")
    tenant_id = _env("VITALIS_TENANT_ID")

    headers = {
        "Authorization": f"Bearer {token}",
        "X-Tenant-ID": tenant_id,
        "Content-Type": "application/json",
    }

    # Build HOSPITAL_CODE -> hospital id map (code or id from API)
    hospitals_url = f"{base_url}/hospitals?skip=0&limit=500"
    get_headers = {"Authorization": headers["Authorization"], "X-Tenant-ID": headers["X-Tenant-ID"], "Accept": "application/json"}
    req = Request(hospitals_url, method="GET", headers=get_headers)
    with urlopen(req, timeout=30) as resp:
        hospitals = json.loads(resp.read().decode("utf-8"))
    code_to_id: dict[str, str] = {}
    for h in hospitals:
        hid = str(h.get("id", ""))
        if hid:
            code_to_id[hid] = hid  # id as key (e.g. legacy code used as id)
        c = h.get("code")
        if c and str(c).strip():
            code_to_id[str(c).strip()] = hid
    print(f"Resolved {len(hospitals)} hospitals, {len(code_to_id)} code/id keys")

    created = 0
    failed = 0
    skipped = 0
    with open(csv_path, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        for i, row in enumerate(rows):
            if i < skip_first_n:
                continue
            # Normalize keys (strip quotes and spaces from CSV header)
            row = {k.strip().strip('"'): (v or "").strip().strip('"') if isinstance(v, str) else (v or "") for k, v in row.items()}
            hospital_code = _clean(row.get("HOSPITAL_CODE"))
            if not hospital_code:
                print(f"Row {i + 2}: skip - no HOSPITAL_CODE")
                skipped += 1
                continue
            hospital_id = code_to_id.get(hospital_code)
            if not hospital_id:
                print(f"Row {i + 2}: skip - unknown HOSPITAL_CODE {hospital_code!r}")
                skipped += 1
                continue
            name = _clean(row.get("BRANCH_NAME"))
            if not name:
                print(f"Row {i + 2}: skip - no BRANCH_NAME")
                skipped += 1
                continue
            payload = {
                "name": name,
                "address": _clean(row.get("BRANCH_ADDRESS")),
                "contact_person": _clean(row.get("CONTACT_PERSON")),
                "location": _clean(row.get("LOCATION")),
                "remarks": _clean(row.get("REMARKS")),
            }
            url = f"{base_url}/hospitals/{hospital_id}/branches"
            body = json.dumps(payload).encode("utf-8")
            req = Request(url, data=body, method="POST", headers=headers)
            try:
                with urlopen(req, timeout=30) as resp:
                    if resp.status in (200, 201):
                        created += 1
                        print(f"Created: {name[:50]}")
                    else:
                        failed += 1
                        print(f"FAIL Row {i + 2}: {resp.status}")
            except HTTPError as e:
                failed += 1
                msg = e.read().decode("utf-8", errors="replace")[:200]
                print(f"FAIL Row {i + 2}: {e.code} - {msg}")

    print(f"\nDone. Created: {created}, Failed: {failed}, Skipped: {skipped}")


if __name__ == "__main__":
    main()
