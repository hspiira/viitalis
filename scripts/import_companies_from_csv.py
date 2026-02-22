#!/usr/bin/env python3
"""
Bulk import companies from docs/data/Comps.csv via API.

Company id is a CUID (assigned by server). Legacy identifier is stored only in
company.code (e.g. COMPANY_CODE from CSV). Other imports (schemes, members) resolve
company by code via GET /companies?code=... and use the returned id. See docs/data/CROSS_SYSTEM_LINKING.md.

Also supports Hospitals.csv format (HOSPITAL_CODE, HOSPITAL_NAME, ...). Optional:
import company branches from Hospital Branches.csv when using Hospitals as source.

Can log in with tenant_code, username, password to obtain token and tenant_id,
or use existing VITALIS_TOKEN and VITALIS_TENANT_ID.

Usage (login with minet / admin / adminpass):
  export VITALIS_API_URL="http://localhost:8000/api/v1"
  python scripts/import_companies_from_csv.py

Or use existing token (no login):
  export VITALIS_TOKEN="<JWT>"
  export VITALIS_TENANT_ID="<tenant id>"

  python scripts/import_companies_from_csv.py [companies.csv] [branches.csv]

If path omitted, defaults to docs/data/Comps.csv. Second path is optional (e.g.
Hospital Branches.csv when importing from Hospitals.csv); pass "-" to skip.
"""

from __future__ import annotations

import csv
import json
import os
import sys
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen


def _env(key: str, default: str | None = None) -> str | None:
    v = os.environ.get(key, default)
    return v if (v is not None and str(v).strip() != "") else None


def _env_required(key: str) -> str:
    v = _env(key)
    if v is None:
        raise SystemExit(f"Missing env: {key}")
    return v


def _get(row: dict[str, str], *keys: str) -> str:
    for k in keys:
        if k in row:
            v = row[k]
            return (v or "").strip().strip('"')
    return ""


def _read_csv(path: Path) -> list[dict[str, str]]:
    with open(path, newline="", encoding="utf-8-sig", errors="replace") as f:
        reader = csv.DictReader(f)
        return [
            {k.strip().strip('"'): (v or "").strip().strip('"') for k, v in row.items()}
            for row in reader
        ]


def _parse_int(value: str | None) -> int | None:
    if not value or not str(value).strip():
        return None
    try:
        return int(str(value).strip().replace(",", ""))
    except ValueError:
        return None


def _trunc(s: str | None, max_len: int) -> str | None:
    if s is None:
        return None
    s = s.strip()
    if not s:
        return None
    return s[:max_len] if len(s) > max_len else s


def _api(
    base_url: str,
    token: str,
    tenant_id: str,
    method: str,
    path: str,
    body: dict | None = None,
) -> dict | list:
    url = f"{base_url.rstrip('/')}{path}"
    headers = {
        "Authorization": f"Bearer {token}",
        "X-Tenant-ID": tenant_id,
        "Accept": "application/json",
    }
    if body is not None:
        headers["Content-Type"] = "application/json"
    req = Request(
        url,
        data=json.dumps(body).encode("utf-8") if body else None,
        method=method,
        headers=headers,
    )
    with urlopen(req, timeout=60) as resp:
        raw = resp.read().decode("utf-8", errors="replace")
        return json.loads(raw) if raw else {}


def _login(base_url: str, tenant_code: str, username: str, password: str) -> tuple[str, str]:
    """Login and return (access_token, tenant_id). Gets tenant_id from GET /auth/me."""
    url = f"{base_url.rstrip('/')}/auth/login"
    body = {
        "tenant_code": tenant_code,
        "username": username,
        "password": password,
    }
    req = Request(
        url,
        data=json.dumps(body).encode("utf-8"),
        method="POST",
        headers={"Content-Type": "application/json", "Accept": "application/json"},
    )
    with urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    token = data.get("access_token")
    if not token:
        raise SystemExit("Login response missing access_token")
    me = _api(base_url, token, "", "GET", "/auth/me")
    if isinstance(me, dict):
        tenant_id = me.get("tenant_id")
    else:
        tenant_id = None
    if not tenant_id:
        raise SystemExit("Could not get tenant_id from /auth/me")
    return token, tenant_id


def main() -> None:
    repo_root = Path(__file__).resolve().parent.parent
    data_dir = repo_root / "docs" / "data"
    companies_path = Path(sys.argv[1]) if len(sys.argv) > 1 else data_dir / "Comps.csv"
    branches_path: Path | None = None
    if len(sys.argv) > 2 and sys.argv[2] != "-":
        branches_path = Path(sys.argv[2])

    if not companies_path.is_file():
        raise SystemExit(f"CSV not found: {companies_path}")

    base_url = _env_required("VITALIS_API_URL")

    token: str
    tenant_id: str
    if _env("VITALIS_TOKEN") and _env("VITALIS_TENANT_ID"):
        token = _env_required("VITALIS_TOKEN")
        tenant_id = _env_required("VITALIS_TENANT_ID")
    else:
        tenant_code = _env("VITALIS_TENANT_CODE") or "minet"
        username = _env("VITALIS_USERNAME") or "admin"
        password = _env("VITALIS_PASSWORD") or "adminpass"
        print(f"Logging in as {tenant_code}/{username}...")
        token, tenant_id = _login(base_url, tenant_code, username, password)
        print(f"Got tenant_id: {tenant_id}")

    rows = _read_csv(companies_path)
    created = 0
    skipped = 0
    errors: list[str] = []
    code_to_id: dict[str, str] = {}  # legacy code -> CUID (for branches / other imports)

    # Support both Comps.csv (COMPANY_*) and Hospitals.csv (HOSPITAL_*) columns.
    # id is not sent: server assigns CUID. Only code (legacy ref) is stored.
    for i, row in enumerate(rows):
        code = _get(row, "COMPANY_CODE") or _get(row, "HOSPITAL_CODE")
        name = _get(row, "COMPANY_NAME") or _get(row, "HOSPITAL_NAME")
        if not name:
            errors.append(f"Row {i + 2}: skip - no company/hospital name (code={code})")
            skipped += 1
            continue
        if not code:
            errors.append(f"Row {i + 2}: skip - no COMPANY_CODE/HOSPITAL_CODE ({name})")
            skipped += 1
            continue

        address = _get(row, "COMPANY_ADDRESS") or _get(row, "HOSPITAL_ADDRESS") or None
        phone = _trunc(_get(row, "PHONE_NUMBER") or _get(row, "HOSPITAL_PHONE_NUMBER"), 64) or None
        email = _trunc(_get(row, "EMAIL") or _get(row, "HOSPITAL_EMAIL"), 255) or None
        website = _trunc(_get(row, "WEBSITE") or _get(row, "HOSPITAL_WEBSITE"), 255) or None
        remarks = _get(row, "REMARKS") or _get(row, "HOSPITAL_REMARKS") or None
        location = _trunc(_get(row, "LOCATION"), 255) or None
        district_id = _parse_int(_get(row, "DISTRICT_ID"))
        company_type = _parse_int(_get(row, "COMPANY_TYPE"))
        current_update = (_get(row, "CURRENTUPDATE") or "").strip().upper()
        status = "active" if current_update == "TRUE" else "inactive"

        payload = {
            "code": code,
            "name": _trunc(name, 255) or name[:255],
            "contact_person": _trunc(_get(row, "CONTACT_PERSON"), 255) or None,
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
        try:
            created_resp = _api(base_url, token, tenant_id, "POST", "/companies", payload)
            cid = created_resp.get("id") if isinstance(created_resp, dict) else None
            if cid:
                code_to_id[code] = cid
            created += 1
            if created <= 5 or created % 50 == 0:
                print(f"Created company: {name[:50]} (code={code})")
        except HTTPError as e:
            body = e.read().decode("utf-8", errors="replace")[:200]
            errors.append(f"Row {i + 2} {name[:30]} (code={code}): {e.code} - {body}")

    print(f"\nCompanies: created={created}, skipped={skipped}, errors={len(errors)}")
    for e in errors[:20]:
        print(f"  {e}")
    if len(errors) > 20:
        print(f"  ... and {len(errors) - 20} more")

    if branches_path and branches_path.is_file():
        branch_rows = _read_csv(branches_path)
        branch_created = 0
        branch_skipped = 0
        branch_errors: list[str] = []
        for i, row in enumerate(branch_rows):
            company_code = _get(row, "HOSPITAL_CODE")
            branch_name = _get(row, "BRANCH_NAME")
            if not company_code or not branch_name:
                branch_skipped += 1
                continue
            company_id = code_to_id.get(company_code)
            if not company_id:
                branch_skipped += 1
                continue
            payload = {
                "name": _trunc(branch_name, 255) or branch_name[:255],
                "address": _get(row, "BRANCH_ADDRESS") or None,
                "phone": _trunc(_get(row, "CONTACT_PERSON"), 64) or None,
            }
            try:
                _api(
                    base_url,
                    token,
                    tenant_id,
                    "POST",
                    f"/companies/{company_id}/branches",
                    payload,
                )
                branch_created += 1
            except HTTPError as e:
                body = e.read().decode("utf-8", errors="replace")[:200]
                branch_errors.append(
                    f"Branch row {i + 2} {branch_name[:30]}: {e.code} - {body}"
                )
        print(f"\nBranches: created={branch_created}, skipped={branch_skipped}, errors={len(branch_errors)}")
        for e in branch_errors[:10]:
            print(f"  {e}")
        if len(branch_errors) > 10:
            print(f"  ... and {len(branch_errors) - 10} more")


if __name__ == "__main__":
    main()
