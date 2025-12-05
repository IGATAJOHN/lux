from sqlalchemy.orm import Session
from app.models.all_models import User
from app.core.config import settings
from app.utils.security import get_password_hash, verify_password
from cryptography.fernet import Fernet
from typing import Tuple
import random
import string
import json
import base64
from datetime import datetime, timedelta
import qrcode
from io import BytesIO

def generate_pin() -> str:
    """
    Generate a unique random PIN (6 digits by default).
    """
    pin_length = settings.PIN_LENGTH
    pin = ''.join(random.choices(string.digits, k=pin_length))
    return pin

def hash_pin(pin: str) -> str:
    """
    Hash PIN using bcrypt (same as password hashing).
    """
    return get_password_hash(pin)

def verify_pin(pin: str, hashed: str) -> bool:
    """
    Verify PIN against hashed value.
    """
    return verify_password(pin, hashed)

def check_pin_exists(pin_hash: str, db: Session) -> bool:
    """
    Check if PIN hash already exists in database to ensure uniqueness.
    """
    existing = db.query(User).filter(User.pin_hash == pin_hash).first()
    return existing is not None

def generate_unique_pin(db: Session) -> Tuple[str, str]:
    """
    Generate a unique PIN that doesn't exist in the database.
    Returns: (plain_pin: str, pin_hash: str)
    """
    max_attempts = 100
    for _ in range(max_attempts):
        pin = generate_pin()
        pin_hash = hash_pin(pin)
        if not check_pin_exists(pin_hash, db):
            return pin, pin_hash
    
    raise Exception("Failed to generate unique PIN after max attempts")

def generate_guest_token(user_id: int, unique_id: str, name: str, access_level: str, expiration: datetime) -> str:
    """
    Generate encrypted token for guest verification.
    Token contains: user_id, unique_id, name, access_level, expiration
    Returns: URL-safe base64 encoded encrypted token
    """
    payload = {
        "user_id": user_id,
        "unique_id": unique_id,
        "name": name,
        "access_level": access_level,
        "expiration": expiration.isoformat(),
        "generated_at": datetime.utcnow().isoformat()
    }
    
    # Encrypt payload
    cipher_suite = Fernet(settings.SECRET_QR_KEY.encode())
    encrypted_data = cipher_suite.encrypt(json.dumps(payload).encode())
    # Use URL-safe base64 encoding
    token = base64.urlsafe_b64encode(encrypted_data).decode()
    
    return token

def generate_qr_code(user_id: int, unique_id: str, name: str, access_level: str, expiration: datetime) -> str:
    """
    Generate URL-based QR code that opens guest verification page.
    QR contains: {FRONTEND_URL}/guest-verify/{encrypted_token}
    Returns: Base64 encoded QR code image
    """
    # Generate encrypted token
    token = generate_guest_token(user_id, unique_id, name, access_level, expiration)
    
    # Create verification URL
    verification_url = f"{settings.FRONTEND_URL}/guest-verify/{token}"
    
    # Generate QR code image
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(verification_url)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to base64
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    img_b64 = base64.b64encode(buffer.getvalue()).decode()
    
    return img_b64

def verify_guest_token(token: str) -> dict:
    """
    Decrypt and validate guest verification token.
    Returns: Decrypted payload dict with user info
    Raises: Exception if decryption fails or token is expired
    """
    try:
        cipher_suite = Fernet(settings.SECRET_QR_KEY.encode())
        # Decode URL-safe base64
        encrypted_data = base64.urlsafe_b64decode(token.encode())
        decrypted_data = cipher_suite.decrypt(encrypted_data)
        payload = json.loads(decrypted_data.decode())
        
        # Check expiration
        expiration = datetime.fromisoformat(payload['expiration'])
        if datetime.utcnow() > expiration:
            raise Exception("Token has expired")
        
        return payload
    except Exception as e:
        raise Exception(f"Invalid or expired token: {str(e)}")
