"""Pydantic schemas for Auth API."""

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    tenant_code: str = Field(..., min_length=1)
    username: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
