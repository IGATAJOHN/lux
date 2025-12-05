import sqlite3

def check_last_staff():
    try:
        conn = sqlite3.connect('hotel_v2.db')
        cursor = conn.cursor()
        
        cursor.execute("SELECT id, name, email, user_id FROM staff ORDER BY id DESC LIMIT 1")
        row = cursor.fetchone()
        
        if row:
            print(f"Latest Staff: ID={row[0]}, Name='{row[1]}', Email='{row[2]}', UserID={row[3]}")
            if row[3]:
                print("✅ User ID is SET (User creation logic worked).")
                
                # Check user table for this user_id
                cursor.execute("SELECT id, email, role FROM users WHERE id = ?", (row[3],))
                user = cursor.fetchone()
                if user:
                    print(f"   Associated User: ID={user[0]}, Email='{user[1]}', Role='{user[2]}'")
                else:
                    print("   ❌ User ID refers to non-existent user!")
            else:
                print("❌ User ID is NULL (User creation logic did NOT execute).")
        else:
            print("No staff found.")
            
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_last_staff()
