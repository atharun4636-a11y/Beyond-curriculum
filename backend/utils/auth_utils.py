import hashlib
import json
import base64
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

SALT = b"aegis_learn_enterprise_secure_salt_2026"

def hash_password(password: str) -> str:
    """Hashes password using PBKDF2-HMAC-SHA256 with secret salt."""
    if not password:
        return ""
    return hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), SALT, 100000).hex()

def verify_password(password: str, hashed: str) -> bool:
    """Verifies plain password against stored hash."""
    if not password or not hashed:
        return False
    return hash_password(password) == hashed

def create_access_token(user_data: Dict[str, Any], expires_delta_days: int = 7) -> str:
    """Creates a signed JSON auth token string."""
    payload = {
        "user": user_data,
        "exp": (datetime.now() + timedelta(days=expires_delta_days)).isoformat()
    }
    raw = json.dumps(payload).encode('utf-8')
    return base64.urlsafe_b64encode(raw).decode('utf-8')

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decodes auth token string and returns user payload."""
    try:
        raw = base64.urlsafe_b64decode(token.encode('utf-8'))
        payload = json.loads(raw.decode('utf-8'))
        exp = datetime.fromisoformat(payload["exp"])
        if datetime.now() > exp:
            return None
        return payload.get("user")
    except Exception:
        return None
