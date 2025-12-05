import sqlite3

def fix_db():
    db_path = "hotel_v2.db"
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if column exists
        cursor.execute("PRAGMA table_info(staff)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if "user_id" not in columns:
            print("Adding user_id column to staff table...")
            cursor.execute("ALTER TABLE staff ADD COLUMN user_id INTEGER REFERENCES users(id)")
            conn.commit()
            print("✅ Column added successfully.")
        else:
            print("Column user_id already exists.")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    fix_db()
