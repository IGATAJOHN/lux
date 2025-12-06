import sqlite3

def debug_assignment():
    try:
        conn = sqlite3.connect('hotel_v2.db')
        cursor = conn.cursor()
        
        print("--- Staff Check: 'john onekele' ---")
        cursor.execute("SELECT id, name, department, status, user_id FROM staff WHERE name LIKE '%john onekele%'")
        john = cursor.fetchone()
        if john:
            print(f"FOUND: ID={john[0]}, Name='{john[1]}', Dept='{john[2]}', Status='{john[3]}', UserID={john[4]}")
        else:
            print("❌ 'john onekele' NOT FOUND in staff table.")

        print("\n--- Latest Service Request ---")
        cursor.execute("SELECT id, user_id, type, description, status, staff_id FROM service_requests ORDER BY id DESC LIMIT 1")
        req = cursor.fetchone()
        if req:
            print(f"Latest Request: ID={req[0]}, Type='{req[2]}', Desc='{req[3]}', Status='{req[4]}'")
            print(f"Assigned Staff ID: {req[5]}")
            
            if req[5] is None:
                print("⚠️ Request is UNASSIGNED.")
            elif john and req[5] == john[0]:
                print("✅ Request IS assigned to John Onekele.")
            else:
                print(f"Request assigned to Staff ID {req[5]} (not John).")
        else:
            print("No service requests found.")

        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    debug_assignment()
