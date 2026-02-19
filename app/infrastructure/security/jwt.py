"""JWT token creation and verification.

Uses app.core.config for secret and algorithm.
"""

from datetime import UTC, datetime, timedelta
from typing import Any

import jwt
from jwt import PyJWTError

from app.core.config import get_settings


def create_access_token(
    data: dict[str, Any],
    expires_delta: timedelta | None = None,
) -> str:
    """Create a JWT access token with the given claims."""
    settings = get_settings()
    to_encode = data.copy()
    if expires_delta is not None:
        expire = datetime.now(UTC) + expires_delta
    else:
        expire = datetime.now(UTC) + timedelta(
            minutes=settings.access_token_expire_minutes
        )
    to_encode["exp"] = expire
    return jwt.encode(
        to_encode,
        settings.secret_key.get_secret_value(),
        algorithm=settings.algorithm,
    )


def verify_token(token: str) -> dict[str, Any]:
    """Verify and decode a JWT. Returns the payload.

    Raises ValueError if the token is invalid or expired.
    """
    settings = get_settings()
    try:
        payload = jwt.decode(
            token,
            settings.secret_key.get_secret_value(),
            algorithms=[settings.algorithm],
            options={"require": ["exp"]},
        )
    except PyJWTError as e:
        raise ValueError("Invalid token") from e
    return payload
