from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Float, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    phone = Column(String)
    unique_id = Column(String, unique=True, index=True)
    selfie_image = Column(Text, nullable=True)  # Base64 encoded selfie photo
    role = Column(String, default="guest") # guest, admin, staff
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    # Enhanced authentication fields
    pin_hash = Column(String, nullable=True)
    qr_code_data = Column(Text, nullable=True)
    access_level = Column(String, default="guest")
    qr_expiration = Column(DateTime, nullable=True)
    is_verified = Column(Boolean, default=False)
    fraud_score = Column(Float, default=0.0)

    bookings = relationship("Booking", back_populates="user")
    requests = relationship("ServiceRequest", back_populates="user")
    face_embedding = relationship("FaceEmbedding", uselist=False, back_populates="user")

class FaceEmbedding(Base):
    __tablename__ = "face_embeddings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    embedding_data = Column(Text) # Storing as JSON string or similar for mock
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    is_duplicate = Column(Boolean, default=False)

    user = relationship("User", back_populates="face_embedding")

class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    room_number = Column(String, unique=True, index=True)
    room_type = Column(String) # single, double, suite
    status = Column(String, default="available") # available, occupied, dirty, maintenance
    price_per_night = Column(Float)
    image_url = Column(String, nullable=True)
    description = Column(String, nullable=True)

    bookings = relationship("Booking", back_populates="room")

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=True)
    room_type = Column(String, nullable=True)  # Requested room type (single, double, suite, etc.)
    check_in_date = Column(DateTime)
    check_out_date = Column(DateTime)
    status = Column(String, default="pending") # pending, confirmed, checked_in, checked_out, cancelled
    fraud_score = Column(Float, default=0.0)
    
    # Payment fields
    payment_status = Column(String, default="unpaid") # unpaid, paid, refunded
    amount = Column(Float, nullable=True)  # Total booking amount
    transaction_id = Column(String, nullable=True)  # Payment transaction reference
    payment_date = Column(DateTime, nullable=True)  # When payment was made
    
    user = relationship("User", back_populates="bookings")
    room = relationship("Room", back_populates="bookings")

class ServiceRequest(Base):
    __tablename__ = "service_requests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    type = Column(String) # room_service, cleaning, maintenance
    description = Column(String)
    status = Column(String, default="open") # open, in_progress, completed
    staff_id = Column(Integer, ForeignKey("staff.id"), nullable=True)
    assigned_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="requests")
    staff = relationship("Staff", back_populates="requests")

    @property
    def staff_name(self):
        return self.staff.name if self.staff else None

class Staff(Base):
    __tablename__ = "staff"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, nullable=True)
    phone = Column(String, nullable=True)
    role = Column(String, default="staff") # admin, staff
    department = Column(String, nullable=True) # housekeeping, maintenance, concierge
    status = Column(String, default="active")
    current_task_id = Column(Integer, nullable=True)

    requests = relationship("ServiceRequest", back_populates="staff")

class FraudLog(Base):
    __tablename__ = "fraud_logs"
    id = Column(Integer, primary_key=True, index=True)
    entity_id = Column(String) # e.g., user_id or booking_id
    score = Column(Float)
    reason = Column(String)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

class AnomalyLog(Base):
    __tablename__ = "anomaly_logs"
    id = Column(Integer, primary_key=True, index=True)
    description = Column(String)
    confidence = Column(Float)
    severity = Column(String, default="medium") # low, medium, high
    related_entity = Column(String, nullable=True) # e.g. "Booking #123"
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
