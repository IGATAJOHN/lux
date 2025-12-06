import sqlite3
import json

def create_nin_db():
    db_path = 'nin_db.db'
    
    # Data provided by user
    data = {
        "23145678901": {
            "full_name": "Adeola Moses",
            "dob": "1994-03-18",
            "gender": "Male",
            "phone": "+2348123456780",
            "address": "12 Ogunlana Drive, Surulere, Lagos",
            "nationality": "Nigerian",
            "id_photo": "/9j/4AAQSkZJRgABAQEAYABgAAD/2wCEAAICAgICAgICAgIDAwMDBAQEBAQEBAgGBgYGBgcHBwcHBwkJCQkJCQkKCgoKCgoKDAwMDAwMDAwMDAwMDAz/2wCEAQMDAwQEBQUGBQYLCQcICwoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKDAz/wAARCAAQABADASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAQL/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCfAH//2Q=="
        },
        "45290817654": {
            "full_name": "Fatima Bello",
            "dob": "1997-07-25",
            "gender": "Female",
            "phone": "+2347068891123",
            "address": "5 Aliyu Close, Wuse II, Abuja",
            "nationality": "Nigerian",
            "id_photo": "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxAQEBIQEA4QDxIQEA8QDxAQDxAQFREWFhURFRUYHSggGBolHRUVITEhJSkrLi4uFx8zODMtNygtLisBCgoKDg0OGhAQGi0fHR0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLf/AABEIAMgAyAMBIgACEQEDEQH/xAAXAAEBAQEAAAAAAAAAAAAAAAAAAQIF/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEAMQAAAB5wD/xAAZEAEAAwEBAAAAAAAAAAAAAAABABEhMVH/2gAIAQEAAT8AsgUrctUf/8QAFBEBAAAAAAAAAAAAAAAAAAAAIP/aAAgBAgEBPwBf/8QAFBEBAAAAAAAAAAAAAAAAAAAAIP/aAAgBAwEBPwBf/9k="
        },
        "77319024562": {
            "full_name": "Chinedu Okoro",
            "dob": "1989-11-02",
            "gender": "Male",
            "phone": "+2348037721902",
            "address": "44 Zik Avenue, Uwani, Enugu",
            "nationality": "Nigerian",
            "id_photo": "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxAQEBAQEBAVEBUVFRUQFRUVFRUVFRUXFhUVFRUYHSggGBolGxUVITEhJSkrLi4uFx8zODMtNygtLisBCgoKDg0OGhAQGi0lHyUtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLf/AABEIAMgAyAMBIgACEQEDEQH/xAAXAAADAQAAAAAAAAAAAAAAAAAAAQIF/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEAMQAAABywD/xAAaEAABBQEAAAAAAAAAAAAAAAAAEQMSIUFR/9oACAEBAAE/AJxVJSTk3//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQIBAT8Af//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQMBAT8Af//Z"
        }
    }

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Create Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS nin_records (
                nin TEXT PRIMARY KEY,
                full_name TEXT,
                dob TEXT,
                gender TEXT,
                phone TEXT,
                address TEXT,
                nationality TEXT,
                id_photo TEXT
            )
        """)
        
        # Insert Data
        count = 0
        for nin, info in data.items():
            try:
                cursor.execute("""
                    INSERT OR REPLACE INTO nin_records (nin, full_name, dob, gender, phone, address, nationality, id_photo)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    nin,
                    info['full_name'],
                    info['dob'],
                    info['gender'],
                    info['phone'],
                    info['address'],
                    info['nationality'],
                    info['id_photo']
                ))
                count += 1
            except Exception as e:
                print(f"Error inserting {nin}: {e}")

        conn.commit()
        print(f"✅ Successfully created '{db_path}' and populated {count} records.")
        
        # Verify
        cursor.execute("SELECT nin, full_name FROM nin_records")
        rows = cursor.fetchall()
        print("\n--- Current Records ---")
        for row in rows:
            print(f"NIN: {row[0]}, Name: {row[1]}")

        conn.close()
        
    except Exception as e:
        print(f"Database error: {e}")

if __name__ == "__main__":
    create_nin_db()
