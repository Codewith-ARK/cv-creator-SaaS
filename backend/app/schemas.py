from datetime import datetime
from typing import Any, Literal
from pydantic import BaseModel, ConfigDict, EmailStr, Field, TypeAdapter, field_validator

email_adapter = TypeAdapter(EmailStr)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: str
    name: str
    role: str


class LoginIn(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def validate_login_email(cls, value: str) -> str:
        candidate = value.strip()
        local, separator, domain = candidate.rpartition("@")
        if separator and domain.casefold() == "folio.local":
            normalized = str(email_adapter.validate_python(f"{local}@example.com")).lower()
            return f"{normalized.rsplit('@', 1)[0]}@folio.local"
        return str(email_adapter.validate_python(candidate)).lower()


class RegisterIn(BaseModel):
    email: EmailStr
    name: str = Field(min_length=2, max_length=160)
    password: str = Field(min_length=8, max_length=128)


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class FieldDefinition(BaseModel):
    key: str = Field(pattern=r"^[a-z][a-z0-9_]{0,79}$")
    label: str
    type: Literal["text", "textarea", "date", "url", "email", "list"] = "text"
    required: bool = False
    placeholder: str = ""


class SchemaIn(BaseModel):
    label: str = Field(min_length=1, max_length=120)
    description: str = ""
    icon: str = "•"
    active: bool = True
    fields: list[FieldDefinition]


class SchemaOut(SchemaIn):
    key: str
    version: int
    updated_at: datetime


class BlockIn(BaseModel):
    schema_key: str
    title: str = Field(min_length=1, max_length=180)
    data: dict[str, Any]


class BlockOut(BaseModel):
    id: int
    schema_key: str
    title: str
    data: dict[str, Any]
    version: int
    updated_at: datetime


class CVIn(BaseModel):
    name: str = Field(min_length=1, max_length=180)
    target_role: str = ""
    template_key: str = "paper"
    page_size: Literal["A4", "Letter"] = "A4"
    sections: list[dict[str, Any]] = Field(default_factory=list)


class CVOut(CVIn):
    id: int
    created_at: datetime
    updated_at: datetime


class AdminStats(BaseModel):
    users: int
    cvs: int
    blocks: int
    schemas: int
