"""Tenant ID format validation for API and (Postgres) RLS.

CUID2-style: alphanumeric, hyphen, underscore; max length for safety.
"""

import re

TENANT_ID_MAX_LENGTH = 64
_TENANT_ID_RE = re.compile(
    r"^[a-zA-Z0-9_-]{1," + str(TENANT_ID_MAX_LENGTH) + r"}$"
)


def is_valid_tenant_id_format(value: str) -> bool:
    """Return True if value is safe for use (header validation, SET LOCAL)."""
    if not value or len(value) > TENANT_ID_MAX_LENGTH:
        return False
    return bool(_TENANT_ID_RE.fullmatch(value))
