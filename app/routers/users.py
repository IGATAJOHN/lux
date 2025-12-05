from fastapi import APIRouter, Depends
from app.routers.auth import get_current_user
from app.models.all_models import User
from app.schemas.all_schemas import UserResponse

router = APIRouter()

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user
