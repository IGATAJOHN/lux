from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Hospitality Platform"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "YOUR_SUPER_SECRET_KEY_CHANGE_THIS_IN_PROD"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    DATABASE_URL: str = "sqlite:///./hotel_v2.db"
    # Enhanced Authentication Settings
    SECRET_QR_KEY: str = "Zj9Or3XdKkqPMAvaCYPzzFlPij-HF-AF-2QkrUANF20="  # Valid Fernet key
    QR_EXPIRATION_DAYS: int = 365
    PIN_LENGTH: int = 6
    FACE_MATCH_THRESHOLD: float = 0.85
    FRAUD_SCORE_THRESHOLD: float = 50.0
    FRONTEND_URL: str = "http://localhost:8080"  # Frontend URL for QR codes
    
    # Payment Gateway Settings
    PAYSTACK_SECRET_KEY: str = "sk_test_9142f1d473548030f1ffccbfd43410b1dff95b6d"  # Replace with your Paystack secret key
    PAYSTACK_PUBLIC_KEY: str = "pk_test_84234b091f2a799f42ee84f1282d435026d69aba"  # Replace with your Paystack public key
    
    # Cloudinary Settings (for image uploads)
    CLOUDINARY_CLOUD_NAME: str = "dnmibsz6a"  # Replace with your Cloudinary cloud name
    CLOUDINARY_API_KEY: str = "759243988352412"  # Replace with your Cloudinary API key
    CLOUDINARY_API_SECRET: str = "nVvC3_i98hvaHMgat7Ez9ySpm_s"  # Replace with your Cloudinary API secret
    
    # External Integrations
    TAVILY_API_KEY: Optional[str] = None # Set via Env Var
    GROQ_API_KEY: str = "" # Set via Env Var

    class Config:
        case_sensitive = True

settings = Settings()
