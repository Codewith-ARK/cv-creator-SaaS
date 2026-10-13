import os
from datetime import datetime, timedelta, timezone
import jwt
from pwdlib import PasswordHash

password_hash = PasswordHash.recommended()
JWT_SECRET = os.getenv("JWT_SECRET", "local-only-change-this-secret")
JWT_ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    return password_hash.verify(password, hashed)


def create_access_token(user_id: int, role: str) -> str:
    expires = datetime.now(timezone.utc) + timedelta(minutes=int(os.getenv("ACCESS_TOKEN_MINUTES", "720")))
    return jwt.encode({"sub": str(user_id), "role": role, "exp": expires}, JWT_SECRET, algorithm=JWT_ALGORITHM)
