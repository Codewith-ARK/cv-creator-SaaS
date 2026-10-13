"""Initial Folio schema.

Revision ID: 0001_initial
Revises:
"""
from alembic import op
import sqlalchemy as sa

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table("users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=20), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("email"))
    op.create_index("ix_users_email", "users", ["email"])
    op.create_table("block_schemas",
        sa.Column("key", sa.String(length=80), primary_key=True),
        sa.Column("label", sa.String(length=120), nullable=False),
        sa.Column("description", sa.String(length=300), nullable=False),
        sa.Column("icon", sa.String(length=40), nullable=False),
        sa.Column("fields", sa.JSON(), nullable=False),
        sa.Column("active", sa.Boolean(), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False))
    op.create_table("content_blocks",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("owner_id", sa.Integer(), nullable=False),
        sa.Column("schema_key", sa.String(length=80), nullable=False),
        sa.Column("title", sa.String(length=180), nullable=False),
        sa.Column("data", sa.JSON(), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["owner_id"], ["users.id"], ondelete="CASCADE"))
    op.create_index("ix_content_blocks_owner_id", "content_blocks", ["owner_id"])
    op.create_index("ix_content_blocks_schema_key", "content_blocks", ["schema_key"])
    op.create_table("cvs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("owner_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=180), nullable=False),
        sa.Column("target_role", sa.String(length=180), nullable=False),
        sa.Column("template_key", sa.String(length=80), nullable=False),
        sa.Column("page_size", sa.String(length=20), nullable=False),
        sa.Column("sections", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["owner_id"], ["users.id"], ondelete="CASCADE"))
    op.create_index("ix_cvs_owner_id", "cvs", ["owner_id"])


def downgrade() -> None:
    op.drop_index("ix_cvs_owner_id", table_name="cvs")
    op.drop_table("cvs")
    op.drop_index("ix_content_blocks_schema_key", table_name="content_blocks")
    op.drop_index("ix_content_blocks_owner_id", table_name="content_blocks")
    op.drop_table("content_blocks")
    op.drop_table("block_schemas")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
