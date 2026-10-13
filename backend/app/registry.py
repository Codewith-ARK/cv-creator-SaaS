from datetime import datetime, timezone
from sqlalchemy.orm import Session
from .models import BlockSchema

DEFAULT_SCHEMAS = [
    {"key": "profile", "label": "Profile", "description": "Name and contact information", "icon": "◉", "fields": [
        {"key": "name", "label": "Full name", "type": "text", "required": True}, {"key": "headline", "label": "Professional title", "type": "text"}, {"key": "email", "label": "Email", "type": "email"}, {"key": "phone", "label": "Phone", "type": "text"}, {"key": "location", "label": "Location", "type": "text"}, {"key": "website", "label": "Website or LinkedIn", "type": "url"}], "active": True, "version": 1},
    {"key": "summary", "label": "Summary", "description": "Professional profile or objective", "icon": "✳", "fields": [
        {"key": "text", "label": "Summary", "type": "textarea", "required": True}], "active": True, "version": 1},
    {"key": "experience", "label": "Experience", "description": "Roles, responsibilities and achievements", "icon": "▤", "fields": [
        {"key": "role", "label": "Role", "type": "text", "required": True}, {"key": "company", "label": "Company", "type": "text", "required": True}, {"key": "location", "label": "Location", "type": "text"}, {"key": "start_date", "label": "Start date", "type": "text"}, {"key": "end_date", "label": "End date", "type": "text"}, {"key": "achievements", "label": "Achievements (one per line)", "type": "list"}], "active": True, "version": 1},
    {"key": "education", "label": "Education", "description": "Degrees, courses and qualifications", "icon": "⌂", "fields": [
        {"key": "degree", "label": "Degree or qualification", "type": "text", "required": True}, {"key": "institution", "label": "Institution", "type": "text", "required": True}, {"key": "location", "label": "Location", "type": "text"}, {"key": "start_date", "label": "Start date", "type": "text"}, {"key": "end_date", "label": "End date", "type": "text"}, {"key": "details", "label": "Details", "type": "textarea"}], "active": True, "version": 1},
    {"key": "skills", "label": "Skills", "description": "A focused group of relevant skills", "icon": "✣", "fields": [
        {"key": "items", "label": "Skills (comma separated)", "type": "list", "required": True}], "active": True, "version": 1},
    {"key": "project", "label": "Project", "description": "Selected work and outcomes", "icon": "◇", "fields": [
        {"key": "name", "label": "Project name", "type": "text", "required": True}, {"key": "role", "label": "Your role", "type": "text"}, {"key": "dates", "label": "Dates", "type": "text"}, {"key": "description", "label": "What you did and the outcome", "type": "textarea"}, {"key": "url", "label": "Project link", "type": "url"}], "active": True, "version": 1},
    {"key": "certification", "label": "Certification", "description": "Professional credentials", "icon": "✧", "fields": [
        {"key": "name", "label": "Certification", "type": "text", "required": True}, {"key": "issuer", "label": "Issuing organization", "type": "text"}, {"key": "date", "label": "Date", "type": "text"}, {"key": "url", "label": "Credential link", "type": "url"}], "active": True, "version": 1},
]


def seed_schemas(db: Session) -> None:
    for item in DEFAULT_SCHEMAS:
        if not db.get(BlockSchema, item["key"]):
            row = BlockSchema(**item, updated_at=datetime.now(timezone.utc))
            db.add(row)
    db.commit()
