from sqlalchemy.orm import Session
from app.models.all_models import User
from typing import Dict

def check_duplicate_unique_id(unique_id: str, db: Session, exclude_user_id: int = None) -> bool:
    """
    Check if unique_id already exists in the system.
    """
    query = db.query(User).filter(User.unique_id == unique_id)
    if exclude_user_id:
        query = query.filter(User.id != exclude_user_id)
    
    existing = query.first()
    return existing is not None

def calculate_fraud_score(
    unique_id_duplicate: bool,
    face_duplicate: bool,
    email_duplicate: bool = False
) -> float:
    """
    Calculate fraud risk score based on duplicate checks.
    Returns: Score from 0.0 (no risk) to 100.0 (high risk)
    """
    score = 0.0
    
    if unique_id_duplicate:
        score += 40.0  # High weight for duplicate ID
    
    if face_duplicate:
        score += 50.0  # High weight for duplicate face
    
    if email_duplicate:
        score += 10.0  # Lower weight for email (could be legitimate)
    
    return min(score, 100.0)  # Cap at 100

def get_risk_level(score: float) -> str:
    """
    Categorize fraud score into risk levels.
    """
    if score < 30.0:
        return "low"
    elif score < 70.0:
        return "medium"
    else:
        return "high"

def validate_unique_id_format(unique_id: str) -> bool:
    """
    Validate unique_id format.
    Expected format: Alphanumeric, 6-20 characters, may include hyphens
    """
    if not unique_id:
        return False
    
    if len(unique_id) < 6 or len(unique_id) > 20:
        return False
    
    # Check if contains only alphanumeric and hyphens
    allowed_chars = set(string.ascii_letters + string.digits + '-')
    if not all(c in allowed_chars for c in unique_id):
        return False
    
    return True

import string

def generate_unique_id_suggestions(base_id: str) -> list[str]:
    """
    Generate alternative unique_id suggestions if the requested one is taken.
    """
    suggestions = []
    
    # Add numeric suffix
    for i in range(1, 4):
        suggestions.append(f"{base_id}{i}")
    
    # Add random suffix
    random_suffix =  ''.join(random.choices(string.digits, k=3))
    suggestions.append(f"{base_id}-{random_suffix}")
    
    return suggestions

import random
