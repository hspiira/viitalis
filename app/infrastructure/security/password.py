"""Password hashing and verification (bcrypt)."""

import bcrypt


def hash_password(password: str) -> str:
    """Hash a password. Returns bcrypt hash string."""
    return bcrypt.hashpw(
        password.encode("utf-8"), bcrypt.gensalt()
    ).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a password against a bcrypt hash."""
    return bcrypt.checkpw(
        plain.encode("utf-8"), hashed.encode("utf-8")
    )
