import os
import psycopg2
import json

DATABASE_URL = "postgresql://postgres:0826@localhost:5432/daily_grocer"

try:
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    # Check if categories table has image_url column
    cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='categories';")
    columns = [row[0] for row in cur.fetchall()]
    print("Categories Columns:", columns)
    
    cur.execute("SELECT id, name, image_url FROM categories ORDER BY name;")
    rows = cur.fetchall()
    print("Categories in Database:")
    for r in rows:
        print(f"ID: {r[0]} | Name: {r[1]} | Image URL: {r[2]}")
        
    cur.close()
    conn.close()
except Exception as e:
    print("Error:", e)
