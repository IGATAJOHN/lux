from app.database import engine
from sqlalchemy import text

def migrate():
    with engine.connect() as connection:
        try:
            # Add staff_id column
            # Note: SQLite doesn't support adding foreign key constraints easily via ALTER TABLE, 
            # but adding the column is sufficient for now.
            connection.execute(text("ALTER TABLE service_requests ADD COLUMN staff_id INTEGER"))
            print("Added staff_id column.")
        except Exception as e:
            print(f"Could not add staff_id (might already exist): {e}")

        try:
            # Add assigned_at column
            connection.execute(text("ALTER TABLE service_requests ADD COLUMN assigned_at DATETIME"))
            print("Added assigned_at column.")
        except Exception as e:
            print(f"Could not add assigned_at (might already exist): {e}")
            
        connection.commit()

if __name__ == "__main__":
    migrate()
