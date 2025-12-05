import sqlite3

conn = sqlite3.connect('hotel.db')
cursor = conn.cursor()
cursor.execute('SELECT id, email, name, role FROM users WHERE role="admin"')
rows = cursor.fetchall()

print('Admin users:')
for row in rows:
    print(f'  ID: {row[0]}, Email: {row[1]}, Name: {row[2]}, Role: {row[3]}')

conn.close()
