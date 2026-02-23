#!/usr/bin/env python3
"""
Bulk import catalog items (lab types, labs, meds, services) from legacy CSVs via API.

Uses id = CUID; only code is stored for cross-reference. Uses upload endpoints
(POST /lab-types/upload, /labs/upload, /medicines/upload, /services/upload) with batches of 500.

Reads: docs/data/Lab_types.csv, Labs.csv, Meds.csv, Services.csv

Usage (with login):
  export VITALIS_API_URL="http://localhost:8000/api/v1"
  python scripts/import_catalogs_from_csv.py [lab_types.csv] [labs.csv] [meds.csv] [services.csv]

Or with token: export VITALIS_TOKEN="<JWT>" VITALIS_TENANT_ID="<tenant id>"

If paths omitted, defaults to docs/data/Lab_types.csv, Labs.csv, Meds.csv, Services.csv.
Pass "-" to skip a file (e.g. ... - Meds.csv Services.csv).
"""

from __future__ import annotations

import csv
import json
import os
import sys
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

BATCH = 500


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
    with urlopen(req, timeout=120) as resp:
        raw = resp.read().decode("utf-8", errors="replace")
        return json.loads(raw) if raw else {}


def _login(base_url: str, tenant_code: str, username: str, password: str) -> tuple[str, str]:
    url = f"{base_url.rstrip('/')}/auth/login"
    body = {"tenant_code": tenant_code, "username": username, "password": password}
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


def _rows_to_items(
    rows: list[dict[str, str]],
    code_keys: tuple[str, ...],
    name_keys: tuple[str, ...],
) -> list[dict[str, str | None]]:
    """Build list of {name, code} from CSV rows. code/name taken from first matching column."""
    items: list[dict[str, str | None]] = []
    seen_codes: set[str] = set()
    for row in rows:
        code = next((_get(row, k) for k in code_keys if _get(row, k)), None)
        name = next((_get(row, k) for k in name_keys if _get(row, k)), None)
        name = (_trunc(name, 255) or (name[:255] if name else None)) if name else None
        if not name:
            continue
        code = (_trunc(code, 64) or None) if code else None
        key = code or name
        if key in seen_codes:
            continue
        seen_codes.add(key)
        items.append({"name": name, "code": code})
    return items


def _upload_catalog(
    base_url: str,
    token: str,
    tenant_id: str,
    path: str,
    items: list[dict[str, str | None]],
) -> tuple[int, int]:
    """POST upload in batches of BATCH. Returns (created, failed)."""
    total_created = 0
    total_failed = 0
    for start in range(0, len(items), BATCH):
        chunk = items[start : start + BATCH]
        try:
            resp = _api(
                base_url,
                token,
                tenant_id,
                "POST",
                path,
                {"items": chunk},
            )
            if isinstance(resp, dict):
                total_created += resp.get("created", 0)
                total_failed += resp.get("failed", 0)
        except HTTPError as e:
            total_failed += len(chunk)
            print(f"  Upload error: {e.code} - {e.read().decode()[:150]}")
    return total_created, total_failed


def main() -> None:
    repo_root = Path(__file__).resolve().parent.parent
    data_dir = repo_root / "docs" / "data"

    def path_arg(n: int, default: Path) -> Path | None:
        if len(sys.argv) > n and sys.argv[n] == "-":
            return None
        p = Path(sys.argv[n]) if len(sys.argv) > n else default
        return p if p.is_file() else None

    lab_types_path = path_arg(1, data_dir / "Lab_types.csv")
    labs_path = path_arg(2, data_dir / "Labs.csv")
    meds_path = path_arg(3, data_dir / "Meds.csv")
    services_path = path_arg(4, data_dir / "Services.csv")

    if not (lab_types_path or labs_path or meds_path or services_path):
        raise SystemExit(
            "At least one CSV required. Looked for Lab_types.csv, Labs.csv, Meds.csv, Services.csv in docs/data."
        )

    base_url = _env_required("VITALIS_API_URL")
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

    # Column names per CSV: code and name (first match wins)
    # Lab_types: LABARATORYTESTTYPEID, LABARATORYTESTTYPENAME
    # Labs: LABTESTCODE, LABTESTNAME; Meds: MEDICINEID, MEDICINENAME; Services: SERVICEID, SERVICENAME
    code_keys = (
        "LABARATORYTESTTYPEID", "LABTESTCODE", "MEDICINEID", "SERVICEID",
        "CODE", "ID", "LAB_CODE", "MEDICINE_CODE", "SERVICE_CODE",
    )
    name_keys = (
        "LABARATORYTESTTYPENAME", "LABTESTNAME", "MEDICINENAME", "SERVICENAME",
        "NAME", "LAB_NAME", "MEDICINE_NAME", "SERVICE_NAME",
    )

    if lab_types_path:
        rows = _read_csv(lab_types_path)
        items = _rows_to_items(rows, code_keys, name_keys)
        if items:
            c, f = _upload_catalog(base_url, token, tenant_id, "/lab-types/upload", items)
            print(f"Lab types: created={c}, failed={f}")
        else:
            print("Lab types: no rows with name (skipped)")

    if labs_path:
        rows = _read_csv(labs_path)
        items = _rows_to_items(rows, code_keys, name_keys)
        if items:
            c, f = _upload_catalog(base_url, token, tenant_id, "/labs/upload", items)
            print(f"Labs: created={c}, failed={f}")
        else:
            print("Labs: no rows with name (skipped)")

    if meds_path:
        rows = _read_csv(meds_path)
        items = _rows_to_items(rows, code_keys, name_keys)
        if items:
            c, f = _upload_catalog(base_url, token, tenant_id, "/medicines/upload", items)
            print(f"Meds: created={c}, failed={f}")
        else:
            print("Meds: no rows with name (skipped)")

    if services_path:
        rows = _read_csv(services_path)
        items = _rows_to_items(rows, code_keys, name_keys)
        if items:
            c, f = _upload_catalog(base_url, token, tenant_id, "/services/upload", items)
            print(f"Services: created={c}, failed={f}")
        else:
            print("Services: no rows with name (skipped)")


if __name__ == "__main__":
    main()
