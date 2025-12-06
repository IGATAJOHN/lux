from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from app.database import get_db
from app.models.all_models import User, FaceEmbedding
from app.schemas.all_schemas import (
    UserCreate, Token, UserResponse, FaceMatchResponse,
    UserRegisterEnhanced, RegistrationResponse,
    UniqueIdVerificationRequest, UniqueIdVerificationResponse,
    FaceEnrollRequest, FaceMatchRequest
)
from app.utils.security import verify_password, get_password_hash, create_access_token
from app.services import face_service, access_service, fraud_service, cloudinary_service, ai_service
from jose import JWTError, jwt
from app.core.config import settings
from datetime import datetime, timedelta

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="auth/login", auto_error=False)

def get_current_user_optional(token: str = Depends(oauth2_scheme_optional), db: Session = Depends(get_db)):
    if not token:
        return None
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            return None
    except JWTError:
        return None
    
    return db.query(User).filter(User.email == email).first()

@router.post("/register", response_model=RegistrationResponse)
def register(user: UserRegisterEnhanced, db: Session = Depends(get_db)):
    """
    SAFE DEMO VERSION (NO OpenCV, NO Cloudinary, NO AI APIs)
    -------------------------------------------------------
    Features:
    - Unique ID validation
    - Duplicate checks
    - Synthetic face embedding (no CV2)
    - Mock anomaly detection
    - Mock OSINT check
    - Auto PIN + QR code generation
    - Full CORS compatibility
    """

    # 1. Validate unique ID (mock NIN = 11 digits)
    if not fraud_service.validate_unique_id_format(user.unique_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid Unique ID format. Must be 11 digits."
        )

    # 2. Duplicate email
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    # 3. Duplicate Unique ID
    if fraud_service.check_duplicate_unique_id(user.unique_id, db):
        raise HTTPException(
            status_code=400,
            detail="Unique ID already exists"
        )

    # 4. Synthetic face embedding (no cv2)
    face_embedding = f"synthetic-embedding-{hash(user.selfie_image) % 999999}"

    # 5. Duplicate face check (mock)
    # If any user already has the same synthetic hash → duplicate
    existing_face = (
        db.query(FaceEmbedding)
        .filter(FaceEmbedding.embedding == face_embedding)
        .first()
    )
    face_duplicate = existing_face is not None

    # 6. Fraud score (mock)
    fraud_score = fraud_service.calculate_fraud_score(
        unique_id_duplicate=False,
        face_duplicate=face_duplicate,
        email_duplicate=False
    )

    # 7. Generate PIN
    pin, pin_hash = access_service.generate_unique_pin(db)

    # 8. QR code expiration
    expiration = datetime.utcnow() + timedelta(days=settings.QR_EXPIRATION_DAYS)

    # 9. NO cloudinary – store base64 directly
    selfie_url = user.selfie_image

    # 10. Create user record
    hashed_password = get_password_hash(user.password)
    new_user = User(
        name=user.name,
        email=user.email,
        hashed_password=hashed_password,
        phone=user.phone,
        unique_id=user.unique_id,
        selfie_image=selfie_url,
        pin_hash=pin_hash,
        access_level="guest",
        fraud_score=fraud_score,
        is_verified=fraud_score < 30.0,
        role="guest"
    )
    db.add(new_user)
    db.flush()  # gets ID

    # 11. Generate QR code
    qr_code_base64 = access_service.generate_qr_code(
        user_id=new_user.id,
        unique_id=new_user.unique_id,
        name=new_user.name,
        access_level=new_user.access_level,
        expiration=expiration
    )
    new_user.qr_code_data = qr_code_base64
    new_user.qr_expiration = expiration

    # Save face embedding (synthetic)
    synthetic_face_record = FaceEmbedding(
        user_id=new_user.id,
        embedding=face_embedding
    )
    db.add(synthetic_face_record)

    db.commit()
    db.refresh(new_user)

    # 12. Create JWT
    token = create_access_token(data={"sub": new_user.email})

    # 13. Mock anomaly detection (no AI or external APIs)
    anomaly_alert = None
    if fraud_score > 70:
        anomaly_alert = "High-risk behavior detected (mock check)."

    # 14. Mock OSINT check
    osint_summary = f"OSINT mock: {new_user.name} appears low-risk."

    # 15. Return response
    return RegistrationResponse(
        user_id=new_user.id,
        token=token,
        pin=pin,
        qr_code_base64=qr_code_base64,
        access_level=new_user.access_level,
        fraud_score=fraud_score,
        osint_summary=osint_summary,
        anomaly_alert=anomaly_alert
    )

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    Login with optional biometric challenge for high-risk users.
    """
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user.email})
    
    # Check if biometric challenge is needed (high fraud score)
    biometric_challenge = user.fraud_score >= settings.FRAUD_SCORE_THRESHOLD
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "biometric_challenge": biometric_challenge
    }

@router.post("/verify-unique-id", response_model=UniqueIdVerificationResponse)
def verify_unique_id(request: UniqueIdVerificationRequest, db: Session = Depends(get_db)):
    """
    Validate unique_id format and check for duplication.
    Returns validation result with suggestions if duplicate.
    """
    # Validate format
    is_valid = fraud_service.validate_unique_id_format(request.unique_id)
    
    # Check duplication
    is_duplicate = fraud_service.check_duplicate_unique_id(request.unique_id, db)
    
    # Generate suggestions if duplicate
    suggestions = None
    if is_duplicate:
        suggestions = fraud_service.generate_unique_id_suggestions(request.unique_id)
    
    return UniqueIdVerificationResponse(
        is_valid=is_valid,
        is_duplicate=is_duplicate,
        suggestions=suggestions
    )

@router.post("/face-enroll")
def face_enroll(
    request: FaceEnrollRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Enroll or update face embedding for current user.
    """
    try:
        embedding = face_service.generate_face_embedding(request.selfie_image)
        face_service.save_face_embedding(current_user.id, embedding, db)
        return {"message": "Face enrolled successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Face enrollment failed: {str(e)}")

@router.post("/face-match", response_model=FaceMatchResponse)
def face_match(
    request: FaceMatchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Match provided selfie against stored face embedding.
    Returns match result with confidence score.
    """
    if not current_user.face_embedding:
        raise HTTPException(status_code=400, detail="No face embedding found. Please enroll first.")
    
    try:
        # Generate embedding from provided selfie
        new_embedding = face_service.generate_face_embedding(request.selfie_image)
        
        # Compare with stored embedding
        is_match, confidence = face_service.compare_embeddings(
            new_embedding,
            current_user.face_embedding.embedding_data
        )
        
        explanation = f"Face {'matched' if is_match else 'did not match'} with {confidence:.2%} confidence"
        
        return FaceMatchResponse(
            match=is_match,
            confidence=confidence,
            explanation=explanation
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Face matching failed: {str(e)}")

# Keep original simple registration for backward compatibility
@router.post("/register-simple", response_model=UserResponse)
def register_simple(user: UserCreate, db: Session = Depends(get_db)):
    """
    Simple registration (legacy endpoint for backward compatibility).
    """
    from app.services import user_service
    
    db_user = user_service.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    return user_service.create_user(db, user)
