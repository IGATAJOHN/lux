from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# --- Auth & User ---
class UserBase(BaseModel):
    email: str
    name: Optional[str] = None
    phone: Optional[str] = None
    unique_id: Optional[str] = None

class UserCreate(UserBase):
    password: str
    selfie_image: Optional[str] = None # Base64 string

class UserRegisterEnhanced(BaseModel):
    name: str
    email: str
    password: str
    phone: str
    unique_id: str
    selfie_image: str  # Base64 encoded image - required for enhanced registration

class RegistrationResponse(BaseModel):
    user_id: int
    token: str
    pin: str  # Plaintext PIN (only returned once)
    qr_code_base64: str  # Base64 encoded QR code image
    access_level: str
    fraud_score: float

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(UserBase):
    id: int
    role: str
    access_level: Optional[str] = None
    is_verified: Optional[bool] = None
    fraud_score: Optional[float] = None
    qr_expiration: Optional[datetime] = None
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    biometric_challenge: Optional[bool] = False  # Flag if biometric verification required

class TokenData(BaseModel):
    email: Optional[str] = None

# --- Unique ID Verification ---
class UniqueIdVerificationRequest(BaseModel):
    unique_id: str

class UniqueIdVerificationResponse(BaseModel):
    is_valid: bool
    is_duplicate: bool
    suggestions: Optional[List[str]] = None

# --- Face Auth ---
class FaceEnrollRequest(BaseModel):
    selfie_image: str  # Base64 encoded

class FaceMatchRequest(BaseModel):
    selfie_image: str  # Base64 encoded

class FaceMatchResponse(BaseModel):
    match: bool
    confidence: float
    explanation: str

# --- Access Credentials ---
class PinGenerationResponse(BaseModel):
    pin: str  # Plaintext (only shown once)
    message: str

class QrGenerationResponse(BaseModel):
    qr_code_base64: str
    expiration: datetime
    message: str

class AccessCredentialsResponse(BaseModel):
    user_id: int
    access_level: str
    has_pin: bool
    has_qr_code: bool
    qr_expiration: Optional[datetime] = None
    qr_code_base64: Optional[str] = None

class GuestVerifyResponse(BaseModel):
    user_id: int
    name: str
    unique_id: str
    email: str
    phone: str
    access_level: str
    has_active_booking: bool
    booking_id: Optional[int] = None
    booking_status: Optional[str] = None
    room_number: Optional[str] = None
    check_in_date: Optional[datetime] = None
    check_out_date: Optional[datetime] = None
    payment_status: Optional[str] = None
    amount: Optional[float] = None
    selfie_image: Optional[str] = None  # Base64 encoded selfie

# --- Booking ---
class BookingCreate(BaseModel):
    guest_id: Optional[int] = None # If creating for someone else, otherwise current user
    check_in_date: datetime
    check_out_date: datetime
    room_type: str
    preferences: Optional[str] = None

class BookingResponse(BaseModel):
    id: int
    user_id: int
    room_id: Optional[int]
    check_in_date: datetime
    check_out_date: datetime
    status: str
    fraud_score: float
    class Config:
        from_attributes = True

# --- Room ---
# --- Room ---
class RoomBase(BaseModel):
    room_number: str
    room_type: str
    price_per_night: float
    status: str
    image_url: Optional[str] = None
    description: Optional[str] = None

class RoomCreate(RoomBase):
    pass

class RoomResponse(RoomBase):
    id: int
    class Config:
        from_attributes = True

class RoomAssign(BaseModel):
    booking_id: int
    room_id: Optional[int] = None # If None, auto-assign

class RoomStatusUpdate(BaseModel):
    room_id: int
    status: str

class RoomUpdate(BaseModel):
    room_number: Optional[str] = None
    room_type: Optional[str] = None
    price_per_night: Optional[float] = None
    status: Optional[str] = None
    image_url: Optional[str] = None
    description: Optional[str] = None

# --- Staff ---
class StaffBase(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    role: str = "staff"
    department: Optional[str] = None
    status: str = "active"

class StaffCreate(StaffBase):
    pass

class StaffResponse(StaffBase):
    id: int
    current_task_id: Optional[int] = None
    class Config:
        from_attributes = True

# --- Service Request ---
class ServiceRequestCreate(BaseModel):
    type: str
    description: str

class ServiceRequestResponse(BaseModel):
    id: int
    user_id: int
    type: str
    description: str
    status: str
    staff_id: Optional[int] = None
    staff_name: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True
    
    @classmethod
    def model_validate(cls, obj):
        if hasattr(obj, 'staff') and obj.staff:
            staff_name = obj.staff.name
        else:
            staff_name = None
            
        return cls(
            id=obj.id,
            user_id=obj.user_id,
            type=obj.type,
            description=obj.description,
            status=obj.status,
            staff_id=obj.staff_id,
            staff_name=staff_name,
            created_at=obj.created_at
        )
        return ServiceRequestResponse(**data)

class RequestStatusUpdate(BaseModel):
    request_id: int
    status: str

# --- AI ---
class FraudScoreResponse(BaseModel):
    score: float
    risk_level: str
    explanation: List[str]

class AnomalyResponse(BaseModel):
    anomaly: bool
    confidence: float
    explanation: List[str]

class RecommendationResponse(BaseModel):
    recommendations: List[str]
