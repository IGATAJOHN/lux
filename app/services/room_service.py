from sqlalchemy.orm import Session
from app.models.all_models import Room, Booking
from app.schemas.all_schemas import RoomCreate, RoomAssign

def get_rooms(db: Session, status: str = None):
    query = db.query(Room)
    if status:
        query = query.filter(Room.status == status)
    return query.all()

def create_room(db: Session, room: RoomCreate):
    new_room = Room(**room.dict())
    db.add(new_room)
    db.commit()
    db.refresh(new_room)
    return new_room

def assign_room(db: Session, assignment: RoomAssign):
    booking = db.query(Booking).filter(Booking.id == assignment.booking_id).first()
    if not booking:
        return None, "Booking not found"
    
    room_id = assignment.room_id
    if not room_id:
        # Auto-assign
        available_room = db.query(Room).filter(Room.status == "available").first()
        if not available_room:
             return None, "No available rooms"
        room_id = available_room.id
    
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room or room.status != "available":
        return None, "Room not available"
        
    booking.room_id = room.id
    room.status = "occupied"
    db.commit()
    return room, None

def update_room_status(db: Session, room_id: int, status: str):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        return None, "Room not found"
    room.status = status
    db.commit()
    return room, None

def update_room(db: Session, room_id: int, room_data: dict):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        return None, "Room not found"
    
    for key, value in room_data.items():
        if value is not None:
            setattr(room, key, value)
            
    db.commit()
    db.refresh(room)
    return room, None
