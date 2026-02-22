#!/usr/bin/env python3
"""
Bulk import hospitals, hospital branches, and doctors from legacy CSVs via API.

Uses id = CUID (assigned by server); only code is stored for cross-reference.
- Hospitals: code = HOSPITAL_CODE
- Doctors: linked via hospital_id (resolve HOSPITALID -> hospital id by code)

Reads: docs/data/Hospitals.csv, Hospital Branches.csv, Doctors.csv

Usage (with login):
  export VITALIS_API_URL="http://localhost:8000/api/v1"
  python scripts/import_hospitals_from_csv.py [hospitals.csv] [branches.csv] [doctors.csv]

Or with token: export VITALIS_TOKEN="<JWT>" VITALIS_TENANT_ID="<tenant id>"

If paths omitted, defaults to docs/data/Hospitals.csv, Hospital Branches.csv, Doctors.csv.
Pass "-" for a file to skip it (e.g. skip doctors: ... Hospitals.csv "Hospital Branches.csv" -).
"""

from __future__ import annotations

import csv
import json
import os
import sys
from datetime import date
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


def _parse_float(value: str | None) -> float | None:
    if not value or not str(value).strip():
        return None
    try:
        return float(str(value).strip().replace(",", ""))
    except ValueError:
        return None


def _parse_date(value: str | None) -> date | None:
    if not value or not str(value).strip():
        return None
    s = str(value).strip()
    if " " in s:
        s = s.split(" ")[0]
    try:
        parts = s.split("/")
        if len(parts) == 3:
            d, m, y = int(parts[0]), int(parts[1]), int(parts[2])
            return date(y, m, d)
    except (ValueError, IndexError):
        pass
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


def main() -> None:
    repo_root = Path(__file__).resolve().parent.parent
    data_dir = repo_root / "docs" / "data"
    hospitals_path = Path(sys.argv[1]) if len(sys.argv) > 1 else data_dir / "Hospitals.csv"
    if len(sys.argv) > 2 and sys.argv[2] == "-":
        branches_path = None
    else:
        branches_path = Path(sys.argv[2]) if len(sys.argv) > 2 else data_dir / "Hospital Branches.csv"
        if branches_path and not branches_path.is_file():
            branches_path = None
    if len(sys.argv) > 3 and sys.argv[3] == "-":
        doctors_path = None
    else:
        doctors_path = Path(sys.argv[3]) if len(sys.argv) > 3 else data_dir / "Doctors.csv"
        if doctors_path and not doctors_path.is_file():
            doctors_path = None

    if not hospitals_path.is_file():
        raise SystemExit(f"CSV not found: {hospitals_path}")

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

    hospital_code_to_id: dict[str, str] = {}
    errors: list[str] = []

    # 1) Hospitals (code only for cross-reference; id = CUID)
    rows = _read_csv(hospitals_path)
    created = 0
    for i, row in enumerate(rows):
        code = _get(row, "HOSPITAL_CODE")
        name = _get(row, "HOSPITAL_NAME")
        if not name or not code:
            continue
        payload = {
            "name": _trunc(name, 255) or name[:255],
            "code": code,
            "reference": _trunc(_get(row, "HOSPITAL_REFERENCE"), 64) or None,
            "address": _get(row, "HOSPITAL_ADDRESS") or None,
            "contact_person": _trunc(_get(row, "CONTACT_PERSON"), 255) or None,
            "phone": _trunc(_get(row, "HOSPITAL_PHONE_NUMBER"), 64) or None,
            "email": _trunc(_get(row, "HOSPITAL_EMAIL"), 255) or None,
            "website": _trunc(_get(row, "HOSPITAL_WEBSITE"), 255) or None,
            "remarks": _get(row, "HOSPITAL_REMARKS") or None,
            "district_id": _parse_int(_get(row, "DISTRICT_ID")),
            "outpatient_capacity": _parse_int(_get(row, "OUTPATIENT_CAPACITY")),
            "inpatient_capacity": _parse_int(_get(row, "INPATIENT_CAPACITY")),
            "out_or_in_patient": _trunc(_get(row, "OUTORINPATIENT"), 32) or None,
            "dental": _get(row, "DENTAL") == "1" if _get(row, "DENTAL") else None,
            "status": "active" if (_get(row, "CURRENTUPDATE") or "").strip().upper() == "TRUE" else "inactive",
        }
        try:
            resp = _api(base_url, token, tenant_id, "POST", "/hospitals", payload)
            if isinstance(resp, dict) and resp.get("id"):
                hospital_code_to_id[code] = resp["id"]
            created += 1
            if created <= 5 or created % 50 == 0:
                print(f"Created hospital: {name[:50]} (code={code})")
        except HTTPError as e:
            body_err = e.read().decode("utf-8", errors="replace")[:200]
            errors.append(f"Hospital row {i + 2} {name[:30]}: {e.code} - {body_err}")
    print(f"Hospitals: created={created}, errors={len(errors)}")

    # 2) Branches (resolve HOSPITAL_CODE -> hospital_id)
    if branches_path and branches_path.is_file():
        branch_rows = _read_csv(branches_path)
        branch_created = 0
        for i, row in enumerate(branch_rows):
            company_code = _get(row, "HOSPITAL_CODE")
            branch_name = _get(row, "BRANCH_NAME")
            if not company_code or not branch_name:
                continue
            hid = hospital_code_to_id.get(company_code)
            if not hid:
                continue
            payload = {
                "name": _trunc(branch_name, 255) or branch_name[:255],
                "address": _get(row, "BRANCH_ADDRESS") or None,
                "contact_person": _trunc(_get(row, "CONTACT_PERSON"), 255) or None,
                "location": _trunc(_get(row, "LOCATION"), 255) or None,
                "remarks": _get(row, "REMARKS") or None,
            }
            try:
                _api(base_url, token, tenant_id, "POST", f"/hospitals/{hid}/branches", payload)
                branch_created += 1
            except HTTPError:
                pass
        print(f"Branches: created={branch_created}")

    # 3) Doctors (resolve HOSPITALID -> hospital_id)
    if doctors_path and doctors_path.is_file():
        doctor_rows = _read_csv(doctors_path)
        doctor_created = 0
        for i, row in enumerate(doctor_rows):
            hospital_code = _get(row, "HOSPITALID")
            name = _get(row, "DOCTOR_NAME")
            if not name or not hospital_code:
                continue
            hid = hospital_code_to_id.get(hospital_code)
            if not hid:
                continue
            dob = _parse_date(_get(row, "DATEOFBIRTH"))
            payload = {
                "hospital_id": hid,
                "name": _trunc(name, 255) or name[:255],
                "reference": _trunc(_get(row, "DOCTOR_REFERENCENO"), 64) or None,
                "date_of_birth": dob.isoformat() if dob else None,
                "address": _get(row, "ADDRESS") or None,
                "phone_home": _trunc(_get(row, "TELHOME"), 64) or None,
                "phone_mobile": _trunc(_get(row, "TELMOBILE"), 64) or None,
                "licence_no": _trunc(_get(row, "LICENCENO"), 64) or None,
                "department": _trunc(_get(row, "DEPARTMENT"), 255) or None,
                "specialization": _trunc(_get(row, "SPECIALIZATION"), 255) or None,
                "doctor_category": _trunc(_get(row, "DOCTORCATEGORY"), 64) or None,
                "email": _trunc(_get(row, "EMAIL"), 255) or None,
                "website": _trunc(_get(row, "WEBSITE"), 255) or None,
                "gender": _trunc(_get(row, "GENDER"), 32) or None,
                "remarks": _get(row, "REMARKS") or None,
                "service_charges": _parse_float(_get(row, "SERVICECHARGES")),
                "channeling_charges": _parse_float(_get(row, "CHANNELINGCHARGES")),
                "referring_charges": _parse_float(_get(row, "REFERRINGCHARGES")),
            }
            try:
                _api(base_url, token, tenant_id, "POST", "/doctors", payload)
                doctor_created += 1
            except HTTPError as e:
                errors.append(f"Doctor row {i + 2} {name[:30]}: {e.code}")
        print(f"Doctors: created={doctor_created}")

    if errors:
        print("Errors:", *errors[:15], sep="\n  ")


if __name__ == "__main__":
    main()
