from datetime import datetime, timezone
import re
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from .database import get_db
from .dependencies import admin_user, current_user
from .models import BlockSchema, ContentBlock, CV, User
from .schemas import AdminStats, BlockIn, BlockOut, CVIn, CVOut, LoginIn, RegisterIn, SchemaIn, SchemaOut, TokenOut, UserOut
from .security import create_access_token, hash_password, verify_password

api = APIRouter()


def block_out(row: ContentBlock) -> BlockOut:
    return BlockOut(id=row.id, schema_key=row.schema_key, title=row.title, data=row.data, version=row.version, updated_at=row.updated_at)


def cv_out(row: CV) -> CVOut:
    return CVOut(id=row.id, name=row.name, target_role=row.target_role, template_key=row.template_key, page_size=row.page_size, sections=row.sections or [], created_at=row.created_at, updated_at=row.updated_at)


def serialize_schema(row: BlockSchema) -> SchemaOut:
    return SchemaOut(key=row.key, label=row.label, description=row.description, icon=row.icon, fields=row.fields or [], active=row.active, version=row.version, updated_at=row.updated_at)


def validate_block(db: Session, schema_key: str, data: dict) -> None:
    schema = db.get(BlockSchema, schema_key)
    if not schema or not schema.active:
        raise HTTPException(status_code=422, detail="This content type is unavailable")
    for field in schema.fields:
        value = data.get(field["key"])
        is_empty = not value if isinstance(value, (list, dict)) else not str(value or "").strip()
        if field.get("required") and is_empty:
            raise HTTPException(status_code=422, detail=f"{field['label']} is required")


@api.get("/health")
def health():
    return {"status": "ok", "service": "folio-api"}


@api.post("/auth/login", response_model=TokenOut)
def login(payload: LoginIn, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == payload.email.lower()))
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email or password is incorrect")
    return TokenOut(access_token=create_access_token(user.id, user.role), user=user)


@api.post("/auth/register", response_model=TokenOut, status_code=201)
def register(payload: RegisterIn, db: Session = Depends(get_db)):
    email = str(payload.email).strip().lower()
    name = payload.name.strip()
    if len(name) < 2:
        raise HTTPException(status_code=422, detail="Name must contain at least 2 characters")
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    user = User(email=email, name=name, password_hash=hash_password(payload.password), role="client")
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        if db.scalar(select(User).where(User.email == email)):
            raise HTTPException(status_code=409, detail="An account with this email already exists")
        raise
    db.refresh(user)
    return TokenOut(access_token=create_access_token(user.id, user.role), user=user)


@api.get("/auth/me", response_model=UserOut)
def me(user: User = Depends(current_user)):
    return user


@api.get("/schemas", response_model=list[SchemaOut])
def list_schemas(db: Session = Depends(get_db), user: User = Depends(current_user)):
    return [serialize_schema(x) for x in db.scalars(select(BlockSchema).where(BlockSchema.active.is_(True)).order_by(BlockSchema.label))]


@api.get("/blocks", response_model=list[BlockOut])
def list_blocks(db: Session = Depends(get_db), user: User = Depends(current_user)):
    rows = db.scalars(select(ContentBlock).where(ContentBlock.owner_id == user.id).order_by(ContentBlock.updated_at.desc())).all()
    return [block_out(x) for x in rows]


@api.post("/blocks", response_model=BlockOut, status_code=201)
def create_block(payload: BlockIn, db: Session = Depends(get_db), user: User = Depends(current_user)):
    validate_block(db, payload.schema_key, payload.data)
    row = ContentBlock(owner_id=user.id, schema_key=payload.schema_key, title=payload.title, data=payload.data)
    db.add(row)
    db.commit()
    db.refresh(row)
    return block_out(row)


@api.patch("/blocks/{block_id}", response_model=BlockOut)
def update_block(block_id: int, payload: BlockIn, db: Session = Depends(get_db), user: User = Depends(current_user)):
    row = db.get(ContentBlock, block_id)
    if not row or row.owner_id != user.id:
        raise HTTPException(404, "Content block not found")
    validate_block(db, payload.schema_key, payload.data)
    row.schema_key = payload.schema_key
    row.title = payload.title
    row.data = payload.data
    row.version += 1
    db.commit()
    db.refresh(row)
    return block_out(row)


@api.delete("/blocks/{block_id}", status_code=204)
def delete_block(block_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    row = db.get(ContentBlock, block_id)
    if not row or row.owner_id != user.id:
        raise HTTPException(404, "Content block not found")
    db.delete(row)
    db.commit()


@api.get("/cvs", response_model=list[CVOut])
def list_cvs(db: Session = Depends(get_db), user: User = Depends(current_user)):
    return [cv_out(x) for x in db.scalars(select(CV).where(CV.owner_id == user.id).order_by(CV.updated_at.desc()))]


@api.post("/cvs", response_model=CVOut, status_code=201)
def create_cv(payload: CVIn, db: Session = Depends(get_db), user: User = Depends(current_user)):
    row = CV(owner_id=user.id, **payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return cv_out(row)


@api.get("/cvs/{cv_id}", response_model=CVOut)
def get_cv(cv_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    row = db.get(CV, cv_id)
    if not row or row.owner_id != user.id:
        raise HTTPException(404, "CV not found")
    sections = row.sections or []
    for section in sections:
        for item in section.get("items", []):
            source = db.get(ContentBlock, item.get("source_block_id")) if item.get("source_block_id") else None
            item["source_version"] = source.version if source else item.get("source_version")
            item["stale"] = bool(source and source.version != item.get("snapshot_version"))
    result = cv_out(row)
    result.sections = sections
    return result


@api.put("/cvs/{cv_id}", response_model=CVOut)
def update_cv(cv_id: int, payload: CVIn, db: Session = Depends(get_db), user: User = Depends(current_user)):
    row = db.get(CV, cv_id)
    if not row or row.owner_id != user.id:
        raise HTTPException(404, "CV not found")
    row.name = payload.name
    row.target_role = payload.target_role
    row.template_key = payload.template_key
    row.page_size = payload.page_size
    row.sections = payload.sections
    row.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(row)
    return cv_out(row)


@api.delete("/cvs/{cv_id}", status_code=204)
def delete_cv(cv_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    row = db.get(CV, cv_id)
    if not row or row.owner_id != user.id:
        raise HTTPException(404, "CV not found")
    db.delete(row)
    db.commit()


@api.get("/admin/stats", response_model=AdminStats)
def admin_stats(db: Session = Depends(get_db), _admin: User = Depends(admin_user)):
    return AdminStats(users=db.scalar(select(func.count()).select_from(User)), cvs=db.scalar(select(func.count()).select_from(CV)), blocks=db.scalar(select(func.count()).select_from(ContentBlock)), schemas=db.scalar(select(func.count()).select_from(BlockSchema)))


@api.get("/admin/schemas", response_model=list[SchemaOut])
def admin_schemas(db: Session = Depends(get_db), _admin: User = Depends(admin_user)):
    return [serialize_schema(x) for x in db.scalars(select(BlockSchema).order_by(BlockSchema.label))]


@api.put("/admin/schemas/{key}", response_model=SchemaOut)
def upsert_schema(key: str, payload: SchemaIn, db: Session = Depends(get_db), _admin: User = Depends(admin_user)):
    if not re.fullmatch(r"[a-z][a-z0-9_-]{1,79}", key):
        raise HTTPException(status_code=422, detail="Use a lowercase schema key with letters, numbers, hyphens or underscores")
    keys = [f.key for f in payload.fields]
    if len(keys) != len(set(keys)):
        raise HTTPException(status_code=422, detail="Field keys must be unique")
    row = db.get(BlockSchema, key)
    values = payload.model_dump()
    if row:
        row.label = values["label"]
        row.description = values["description"]
        row.icon = values["icon"]
        row.active = values["active"]
        row.fields = values["fields"]
        row.version += 1
        row.updated_at = datetime.now(timezone.utc)
    else:
        row = BlockSchema(key=key, **values, version=1)
        db.add(row)
    db.commit()
    db.refresh(row)
    return serialize_schema(row)


@api.delete("/admin/schemas/{key}", status_code=204)
def archive_schema(key: str, db: Session = Depends(get_db), _admin: User = Depends(admin_user)):
    row = db.get(BlockSchema, key)
    if not row:
        raise HTTPException(status_code=404, detail="Schema not found")
    row.active = False
    row.version += 1
    db.commit()

