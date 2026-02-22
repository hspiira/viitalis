#!/usr/bin/env python3
"""
Bulk import schemes, scheme plans, and scheme benefits from legacy CSVs via API.

Reads: docs/data/Schemes.csv, Scheme Plans.csv, Schemes - REB.csv
Uses: POST /schemes, GET/POST /plans, POST /schemes/{id}/plans, GET/POST /benefits, POST /schemes/{id}/benefits

Requires: API running; companies must exist with code=COMPANY_CODE (company id is CUID; code is legacy ref).

Linking to other data (e.g. members): The new system stores scheme.code = SCHEME_CODE and
scheme.id = new CUID. To resolve old SCHEME_CODE → new scheme_id use GET /schemes?code={SCHEME_CODE}.
See docs/data/CROSS_SYSTEM_LINKING.md for how company, scheme, plan, benefit link across systems.

Usage (with login, same as company import):
  export VITALIS_API_URL="http://localhost:8000/api/v1"
  python scripts/import_schemes_from_csv.py [schemes.csv] [scheme_plans.csv] [reb.csv]

Or with token:
  export VITALIS_TOKEN="<JWT>" VITALIS_TENANT_ID="<tenant id>"

If paths omitted, defaults to docs/data/Schemes.csv, Scheme Plans.csv, Schemes - REB.csv.
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


def _login(base_url: str, tenant_code: str, username: str, password: str) -> tuple[str, str]:
    """Login and return (access_token, tenant_id)."""
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


def _parse_date(value: str | None) -> date | None:
    if not value or not str(value).strip() or str(value).strip() == "0":
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


def _parse_float(value: str | None) -> float | None:
    if not value or not str(value).strip():
        return None
    try:
        return float(str(value).strip().replace(",", ""))
    except ValueError:
        return None


def _normalize_plan_name(name: str) -> str:
    n = (name or "").strip().upper()
    if n == "IN PATIENT":
        return "IN_PATIENT"
    if n == "OUT PATIENT":
        return "OUT_PATIENT"
    return n.replace(" ", "_") if n else ""


def _status(s: str) -> str:
    return "active" if (s or "").strip().upper() == "ACTIVE" else "inactive"


def _covered(s: str) -> str:
    return "yes" if (s or "").strip().upper() == "YES" else "no"


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
    req = Request(url, data=json.dumps(body).encode("utf-8") if body else None, method=method, headers=headers)
    with urlopen(req, timeout=60) as resp:
        raw = resp.read().decode("utf-8", errors="replace")
        return json.loads(raw) if raw else {}


def main() -> None:
    repo_root = Path(__file__).resolve().parent.parent
    data_dir = repo_root / "docs" / "data"
    schemes_path = Path(sys.argv[1]) if len(sys.argv) > 1 else data_dir / "Schemes.csv"
    plans_path = Path(sys.argv[2]) if len(sys.argv) > 2 else data_dir / "Scheme Plans.csv"
    reb_path = Path(sys.argv[3]) if len(sys.argv) > 3 else data_dir / "Schemes - REB.csv"
    for p in (schemes_path, plans_path, reb_path):
        if not p.is_file():
            raise SystemExit(f"CSV not found: {p}")

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

    scheme_rows = _read_csv(schemes_path)
    plan_rows = _read_csv(plans_path)
    reb_rows = _read_csv(reb_path)

    # Resolve company code -> company id (CUID). Companies use id=CUID, code=legacy ref.
    try:
        companies = _api(base_url, token, tenant_id, "GET", "/companies?skip=0&limit=500")
    except HTTPError:
        companies = []
    company_code_to_id: dict[str, str] = {}
    for c in companies if isinstance(companies, list) else []:
        co = c.get("code")
        if co and str(co).strip():
            company_code_to_id[str(co).strip()] = c["id"]

    code_to_schemes: list[tuple[str, str | None, date | None, date | None]] = []
    schemes_created = 0
    errors: list[str] = []

    # 1) Create schemes (company_id = CUID from code lookup)
    for row in scheme_rows:
        scheme_code = _get(row, "SCHEME_CODE")
        scheme_name = _get(row, "SCHEME_NAME")
        company_code = _get(row, "COMPANY_CODE")
        if not scheme_name:
            errors.append(f"Skip scheme: missing SCHEME_NAME (code={scheme_code})")
            continue
        if not company_code:
            errors.append(f"Skip scheme: missing COMPANY_CODE ({scheme_name})")
            continue
        company_id = company_code_to_id.get(company_code.strip())
        if not company_id:
            errors.append(f"Skip scheme: company code {company_code!r} not found ({scheme_name})")
            continue
        desc = _get(row, "DESCRIPTION") or None
        limit_val = _parse_float(_get(row, "LIMIT_VALUE"))
        begin = _parse_date(_get(row, "BEGINNINGDATE"))
        end = _parse_date(_get(row, "ENDINGDATE"))
        term = _parse_date(_get(row, "TERMINATIONDATE"))
        payload = {
            "company_id": company_id,
            "name": scheme_name,
            "code": scheme_code or None,
            "description": desc,
            "limit_value": limit_val,
            "begin_date": begin.isoformat() if begin else None,
            "end_date": end.isoformat() if end else None,
            "termination_date": term.isoformat() if term else None,
            "status": "active",
        }
        try:
            created = _api(base_url, token, tenant_id, "POST", "/schemes", payload)
            sid = created.get("id")
            code_to_schemes.append((sid, scheme_code or None, begin, end))
            schemes_created += 1
        except HTTPError as e:
            errors.append(f"Scheme {scheme_name}: {e.code} - {e.read().decode()[:150]}")

    # code -> [(scheme_id, begin, end), ...]
    from collections import defaultdict
    code_scheme_list: dict[str, list[tuple[str, date | None, date | None]]] = defaultdict(list)
    for sid, c, b, e in code_to_schemes:
        if c:
            code_scheme_list[c].append((sid, b, e))

    # 2) Plan catalog: distinct PLANNAME -> plan_id
    try:
        existing_plans = _api(base_url, token, tenant_id, "GET", "/plans?skip=0&limit=500")
    except HTTPError:
        existing_plans = []
    plan_code_to_id: dict[str, str] = { (p.get("code") or "").strip(): p["id"] for p in existing_plans if (p.get("code") or "").strip() }
    plans_created = 0
    seen_plan_codes: set[str] = set()
    for row in plan_rows:
        name = _get(row, "PLANNAME")
        code = _normalize_plan_name(name)
        if not code or code in seen_plan_codes:
            continue
        seen_plan_codes.add(code)
        if code in plan_code_to_id:
            continue
        try:
            created = _api(base_url, token, tenant_id, "POST", "/plans", {"name": name, "code": code})
            plan_code_to_id[code] = created["id"]
            plans_created += 1
        except HTTPError as e:
            errors.append(f"Plan {code}: {e.code}")

    # 3) Scheme plans
    scheme_plans_created = 0
    for row in plan_rows:
        scheme_code = _get(row, "SCHEME_CODE")
        plan_name = _get(row, "PLANNAME")
        plan_code = _normalize_plan_name(plan_name)
        if not scheme_code or not plan_code or plan_code not in plan_code_to_id:
            continue
        scheme_list = code_scheme_list.get(scheme_code, [])
        if not scheme_list:
            continue
        scheme_id = scheme_list[0][0]
        plan_begin = _parse_date(_get(row, "BEGINNINGDATE"))
        plan_end = _parse_date(_get(row, "ENDINGDATE"))
        limit_amt = _parse_float(_get(row, "LIMIT_AMOUNT"))
        status = _status(_get(row, "SCHEMEPLANSTATUS"))
        payload = {
            "plan_id": plan_code_to_id[plan_code],
            "limit_amount": limit_amt,
            "begin_date": plan_begin.isoformat() if plan_begin else None,
            "end_date": plan_end.isoformat() if plan_end else None,
            "status": status,
        }
        try:
            _api(base_url, token, tenant_id, "POST", f"/schemes/{scheme_id}/plans", payload)
            scheme_plans_created += 1
        except HTTPError:
            pass  # may already exist

    # 4) Benefit catalog from REB: (SERVICE_NAME, IN_OR_OUT_PATIENT) -> benefit_id
    try:
        existing_benefits = _api(base_url, token, tenant_id, "GET", "/benefits?skip=0&limit=1000")
    except HTTPError:
        existing_benefits = []
    benefit_key_to_id: dict[tuple[str, str], str] = {}
    for b in existing_benefits:
        sn = (b.get("service_name") or "").strip()
        io = (b.get("in_or_out_patient") or "").strip()
        if sn:
            benefit_key_to_id[(sn, io)] = b["id"]
    benefits_created = 0
    seen_benefit_keys: set[tuple[str, str]] = set()
    for row in reb_rows:
        service_name = _get(row, "SERVICE_NAME")
        in_out = _get(row, "IN_OR_OUT_PATIENT") or ""
        if not service_name:
            continue
        key = (service_name, in_out)
        if key in seen_benefit_keys:
            continue
        seen_benefit_keys.add(key)
        if key in benefit_key_to_id:
            continue
        code = _get(row, "SCHEME_BENEFIT_ID") or None
        dur = _get(row, "SCHEME_DURATION")
        try:
            payload = {
                "name": service_name,
                "code": code,
                "service_name": service_name,
                "in_or_out_patient": in_out or None,
                "limit_amount": _parse_float(_get(row, "LIMIT_AMOUNT")),
                "scheme_duration": int(dur) if dur.isdigit() else None,
                "covered": _covered(_get(row, "COVERED")),
                "status": _status(_get(row, "SCHEMESSTATUS")),
                "remarks": _get(row, "COMMENTS") or None,
            }
            created = _api(base_url, token, tenant_id, "POST", "/benefits", payload)
            benefit_key_to_id[key] = created["id"]
            benefits_created += 1
        except HTTPError as e:
            errors.append(f"Benefit {service_name[:30]}: {e.code}")

    # 5) Scheme benefits
    scheme_benefits_created = 0
    for row in reb_rows:
        scheme_code = _get(row, "SCHEME_CODE")
        service_name = _get(row, "SERVICE_NAME")
        in_out = _get(row, "IN_OR_OUT_PATIENT") or ""
        key = (service_name, in_out)
        if not scheme_code or key not in benefit_key_to_id:
            continue
        benefit_id = benefit_key_to_id[key]
        try:
            schemes = _api(base_url, token, tenant_id, "GET", f"/schemes?code={scheme_code}")
        except HTTPError:
            schemes = []
        for s in schemes:
            if s.get("code") != scheme_code:
                continue
            sid = s["id"]
            try:
                _api(
                    base_url,
                    token,
                    tenant_id,
                    "POST",
                    f"/schemes/{sid}/benefits",
                    {
                        "benefit_id": benefit_id,
                        "limit_amount": _parse_float(_get(row, "LIMIT_AMOUNT")),
                        "status": _status(_get(row, "SCHEMESSTATUS")),
                    },
                )
                scheme_benefits_created += 1
            except HTTPError:
                pass

    print(f"Schemes: {schemes_created}, Plans: {plans_created}, SchemePlans: {scheme_plans_created}, Benefits: {benefits_created}, SchemeBenefits: {scheme_benefits_created}")
    if errors:
        print("Errors:", *errors[:20], sep="\n  ")


if __name__ == "__main__":
    main()
