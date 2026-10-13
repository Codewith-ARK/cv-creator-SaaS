from datetime import datetime, timezone
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base


def utcnow():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(160))
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(20), default="client")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    blocks: Mapped[list["ContentBlock"]] = relationship(back_populates="owner", cascade="all, delete-orphan")
    cvs: Mapped[list["CV"]] = relationship(back_populates="owner", cascade="all, delete-orphan")


class BlockSchema(Base):
    __tablename__ = "block_schemas"
    key: Mapped[str] = mapped_column(String(80), primary_key=True)
    label: Mapped[str] = mapped_column(String(120))
    description: Mapped[str] = mapped_column(String(300), default="")
    icon: Mapped[str] = mapped_column(String(40), default="•")
    fields: Mapped[list] = mapped_column(JSON)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    version: Mapped[int] = mapped_column(Integer, default=1)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)


class ContentBlock(Base):
    __tablename__ = "content_blocks"
    id: Mapped[int] = mapped_column(primary_key=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    schema_key: Mapped[str] = mapped_column(String(80), index=True)
    title: Mapped[str] = mapped_column(String(180))
    data: Mapped[dict] = mapped_column(JSON)
    version: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
    owner: Mapped[User] = relationship(back_populates="blocks")


class CV(Base):
    __tablename__ = "cvs"
    id: Mapped[int] = mapped_column(primary_key=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(180))
    target_role: Mapped[str] = mapped_column(String(180), default="")
    template_key: Mapped[str] = mapped_column(String(80), default="paper")
    page_size: Mapped[str] = mapped_column(String(20), default="A4")
    sections: Mapped[list] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
    owner: Mapped[User] = relationship(back_populates="cvs")

