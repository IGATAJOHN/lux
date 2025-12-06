import sqlite3

def check_departments():
    try:
        conn = sqlite3.connect('hotel_v2.db')
        cursor = conn.cursor()
        
        print("--- Staff Departments ---")
        cursor.execute("SELECT id, name, department, status FROM staff")
        rows = cursor.fetchall()
        for row in rows:
            print(f"ID: {row[0]}, Name: {row[1]}, Dept: '{row[2]}', Status: {row[3]}")
            
        print("\n--- Recent Maintenance Requests ---")
        cursor.execute("SELECT id, type, description, status, staff_id FROM service_requests WHERE type='maintenance' ORDER BY id DESC LIMIT 5")
        reqs = cursor.fetchall()
        for req in reqs:
            print(f"ID: {req[0]}, Type: {req[1]}, Status: {req[3]}, StaffID: {req[4]}")
            
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_departments()
