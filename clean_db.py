import sqlite3

def clean_staff():
    db_path = 'hotel_v2.db'
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # 1. Check for Staff without User ID (These cannot login at all)
        cursor.execute("SELECT count(*) FROM staff WHERE user_id IS NULL")
        count_null = cursor.fetchone()[0]
        print(f"Found {count_null} staff records with NO User account (cannot login).")
        
        if count_null > 0:
            cursor.execute("DELETE FROM staff WHERE user_id IS NULL")
            print(f"✅ Deleted {count_null} invalid staff records.")
            
        # 2. Optional: Cleanup specific test accounts if desired?
        # For now, we only stick to the user's request of "staff without password"
        # which techincally means those who didn't get a user created.
        
        conn.commit()
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    clean_staff()
