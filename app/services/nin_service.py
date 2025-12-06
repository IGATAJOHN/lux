import sqlite3
import os

DB_PATH = "nin_db.db"

def get_nin_details(nin: str):
    """
    Query the local NIN database for a user's details.
    """
    if not os.path.exists(DB_PATH):
        return None
        
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row  # Access columns by name
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM nin_records WHERE nin = ?", (nin,))
        row = cursor.fetchone()
        
        conn.close()
        
        if row:
            return dict(row)
        return None
    except Exception as e:
        print(f"Error querying NIN DB: {e}")
        return None
