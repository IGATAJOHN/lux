from fastapi import APIRouter, Body

router = APIRouter()

@router.post("/guest")
def notify_guest(message: str = Body(..., embed=True), guest_id: int = Body(..., embed=True)):
    # Mock notification
    return {"status": "sent", "recipient": f"guest_{guest_id}", "message": message}

@router.post("/staff")
def notify_staff(message: str = Body(..., embed=True), staff_id: int = Body(..., embed=True)):
    # Mock notification
    return {"status": "sent", "recipient": f"staff_{staff_id}", "message": message}
