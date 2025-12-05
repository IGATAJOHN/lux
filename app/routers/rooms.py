from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.all_models import Room, Booking
from app.schemas.all_schemas import RoomResponse, RoomCreate, RoomStatusUpdate, RoomAssign, RoomUpdate
from app.routers.auth import get_current_user

router = APIRouter()

from app.services import room_service

from typing import Optional

@router.get("/", response_model=List[RoomResponse])
def get_rooms(status: Optional[str] = None, db: Session = Depends(get_db)):
    return room_service.get_rooms(db, status)

@router.post("/", response_model=RoomResponse)
def create_room(room: RoomCreate, db: Session = Depends(get_db)): # Should be admin only
    return room_service.create_room(db, room)

@router.post("/assign")
def assign_room(assignment: RoomAssign, db: Session = Depends(get_db)):
    room, error = room_service.assign_room(db, assignment)
    if error:
        if error == "Booking not found":
            raise HTTPException(status_code=404, detail=error)
        else:
            raise HTTPException(status_code=400, detail=error)
    return {"message": "Room assigned", "room_id": room.id}

@router.post("/update-status")
def update_room_status(update: RoomStatusUpdate, db: Session = Depends(get_db)):
    room, error = room_service.update_room_status(db, update.room_id, update.status)
    if error:
        raise HTTPException(status_code=404, detail=error)
    return {"message": "Status updated"}

@router.put("/{room_id}", response_model=RoomResponse)
def update_room(room_id: int, room_update: RoomUpdate, db: Session = Depends(get_db)):
    room, error = room_service.update_room(db, room_id, room_update.dict(exclude_unset=True))
    if error:
        raise HTTPException(status_code=404, detail=error)
    return room
