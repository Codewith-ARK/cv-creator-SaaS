import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from .database import SessionLocal
from .models import ContentBlock, CV, User
from .registry import seed_schemas
from .routes import api
from .security import hash_password


@asynccontextmanager
async def lifespan(_: FastAPI):
    if os.getenv("APP_ENV") == "production" and os.getenv("JWT_SECRET", "local-only-change-this-secret") == "local-only-change-this-secret":
        raise RuntimeError("Set a strong JWT_SECRET before running in production")
    with SessionLocal() as db:
        seed_schemas(db)
        bootstrap_email = os.getenv("BOOTSTRAP_ADMIN_EMAIL")
        bootstrap_password = os.getenv("BOOTSTRAP_ADMIN_PASSWORD")
        if bootstrap_email and bootstrap_password:
            bootstrap_email = bootstrap_email.lower().strip()
            account = db.scalar(select(User).where(User.email == bootstrap_email))
            if account and account.role != "admin":
                raise RuntimeError("BOOTSTRAP_ADMIN_EMAIL belongs to a non-admin account")
            if not account:
                db.add(User(email=bootstrap_email, name=os.getenv("BOOTSTRAP_ADMIN_NAME", "Folio Administrator"), password_hash=hash_password(bootstrap_password), role="admin"))
                db.commit()
        demo_users = [
            ("demo@folio.local", "Alex Morgan", "folio-demo", "client"),
            ("admin@folio.local", "Folio Admin", "folio-admin", "admin"),
        ] if os.getenv("APP_ENV", "development") != "production" else []
        for email, name, password, role in demo_users:
            if not db.scalar(select(User).where(User.email == email)):
                db.add(User(email=email, name=name, password_hash=hash_password(password), role=role))
        db.commit()
        if os.getenv("APP_ENV", "development") != "production":
            demo = db.scalar(select(User).where(User.email == "demo@folio.local"))
            if demo and not demo.cvs:
                content = [
                    ("profile", "Alex Morgan", {"name": "Alex Morgan", "headline": "Product Designer", "email": "alex.morgan@example.com", "phone": "+44 20 7946 0123", "location": "London, UK", "website": "linkedin.com/in/alexmorgan"}),
                    ("summary", "Product designer with 6+ years of experience", {"text": "Product designer with 6+ years of experience creating clear, useful digital products. I bring research, interaction design and practical collaboration together to help teams solve real customer problems."}),
                    ("experience", "Senior Product Designer", {"role": "Senior Product Designer", "company": "Northstar Studio", "location": "London, UK", "start_date": "2021", "end_date": "Present", "achievements": ["Led design for a B2B product used by 50,000+ professionals.", "Improved new-user activation by 28% through a redesigned onboarding flow.", "Built a shared component library adopted across three product teams."]}),
                    ("experience", "Product Designer", {"role": "Product Designer", "company": "Fieldwork", "location": "Manchester, UK", "start_date": "2018", "end_date": "2021", "achievements": ["Designed core experiences for a consumer finance platform.", "Ran usability studies that shaped a simpler account setup."]}),
                    ("education", "B.A. Interaction Design", {"degree": "B.A. Interaction Design", "institution": "University of Leeds", "location": "Leeds, UK", "start_date": "2014", "end_date": "2018", "details": "Graduated with honours"}),
                    ("skills", "Product design", {"items": ["Product strategy", "User research", "Interaction design", "Prototyping", "Design systems", "Figma"]}),
                ]
                rows = [ContentBlock(owner_id=demo.id, schema_key=key, title=title, data=data) for key, title, data in content]
                db.add_all(rows); db.flush()
                by_key = {}
                for row in rows:
                    by_key.setdefault(row.schema_key, []).append(row)
                sections = []
                for key, label in [("profile", "Profile"), ("summary", "Summary"), ("experience", "Experience"), ("education", "Education"), ("skills", "Skills")]:
                    items = by_key.get(key, [])
                    if items:
                        sections.append({"key": key, "title": label, "items": [{"id": f"demo-{item.id}", "source_block_id": item.id, "snapshot_version": item.version, "data": item.data, "title": item.title} for item in items]})
                db.add(CV(owner_id=demo.id, name="Product Designer — Northstar", target_role="Senior Product Designer", template_key="paper", page_size="A4", sections=sections))
                db.commit()
    yield


app = FastAPI(title="Folio API", version="0.1.0", lifespan=lifespan)
origins = os.getenv("CLIENT_ORIGINS", "http://localhost:3000,http://localhost:3001").split(",")
app.add_middleware(CORSMiddleware, allow_origins=[origin.strip() for origin in origins], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(api, prefix="/api/v1")
