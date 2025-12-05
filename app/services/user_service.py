from sqlalchemy.orm import Session
from app.models.all_models import User, FaceEmbedding
from app.schemas.all_schemas import UserCreate
from app.utils.security import get_password_hash
from app.utils.ai_mock import mock_face_embedding

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def create_user(db: Session, user: UserCreate):
    hashed_password = get_password_hash(user.password)
    new_user = User(
        email=user.email,
        name=user.name,
        hashed_password=hashed_password,
        phone=user.phone,
        unique_id=user.unique_id
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    if user.selfie_image:
        embedding = mock_face_embedding(user.selfie_image)
        face_entry = FaceEmbedding(user_id=new_user.id, embedding_data=embedding)
        db.add(face_entry)
        db.commit()
        
    return new_user
