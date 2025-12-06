import sqlite3
import os

DB_FILE = "hotel_v2.db" # Default name, verify if different

def migrate():
    if not os.path.exists(DB_FILE):
        print(f"Database {DB_FILE} not found in current dir.")
        return

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    try:
        # Check if column exists
        cursor.execute("PRAGMA table_info(users)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if "preferences" not in columns:
            print("Adding 'preferences' column to 'users' table...")
            cursor.execute("ALTER TABLE users ADD COLUMN preferences TEXT")
            conn.commit()
            print("Migration successful.")
        else:
            print("Column 'preferences' already exists.")
            
    except Exception as e:
        print(f"Migration error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
