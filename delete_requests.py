from app.database import SessionLocal
from app.models.all_models import ServiceRequest
from sqlalchemy import text

def delete_requests():
    db = SessionLocal()
    try:
        # Delete all rows from service_requests
        db.execute(text("DELETE FROM service_requests"))
        db.commit()
        print("All service requests have been deleted.")
    except Exception as e:
        print(f"Error deleting requests: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    delete_requests()
