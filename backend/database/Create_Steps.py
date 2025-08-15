import sqlite3
import csv
import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from db_helper import get_connection

def create_step_table():
    """Create the Step table with appropriate columns"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('DROP TABLE IF EXISTS Step')
    cursor.execute('''
        CREATE TABLE Step (
            group_id INTEGER PRIMARY KEY,
            language TEXT NOT NULL,
            day INTEGER NOT NULL,
            word1 TEXT,
            definition1 TEXT,
            type1 TEXT,
            word2 TEXT,
            definition2 TEXT,
            type2 TEXT,
            word3 TEXT,
            definition3 TEXT,
            type3 TEXT,
            word4 TEXT,
            definition4 TEXT,
            type4 TEXT,
            word5 TEXT,
            definition5 TEXT,
            type5 TEXT,
            word6 TEXT,
            definition6 TEXT,
            type6 TEXT,
            word7 TEXT,
            definition7 TEXT,
            type7 TEXT,
            word8 TEXT,
            definition8 TEXT,
            type8 TEXT,
            image TEXT,
            video TEXT
        )
    ''')
    # Create UserStep table
    cursor.execute('DROP TABLE IF EXISTS UserStep')
    cursor.execute('''
CREATE TABLE UserStep (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    group_id INTEGER NOT NULL,
    score INTEGER DEFAULT 0,
    FOREIGN KEY(group_id) REFERENCES Step(group_id)
)
''')
    conn.commit()
    conn.close()
    print("Step and UserStep tables created successfully!")

def upload_steps():
    """Upload Steps_data.csv data to the Step table"""
    csv_path = os.path.join(os.path.dirname(__file__), 'Steps_data.csv')
    if not os.path.exists(csv_path):
        print(f"CSV file not found: {csv_path}")
        return
    conn = get_connection()
    cursor = conn.cursor()
    columns = [
        'group_id', 'language', 'day',
        'word1', 'definition1', 'type1',
        'word2', 'definition2', 'type2',
        'word3', 'definition3', 'type3',
        'word4', 'definition4', 'type4',
        'word5', 'definition5', 'type5',
        'word6', 'definition6', 'type6',
        'word7', 'definition7', 'type7',
        'word8', 'definition8', 'type8',
        'image', 'video'
    ]
    rows_uploaded = 0
    try:
        with open(csv_path, 'r', encoding='utf-8') as file:
            csv_reader = csv.reader(file)
            header = next(csv_reader)
            for row in csv_reader:
                row_dict = dict(zip(header, row))
                data = {}
                for col in columns:
                    if col == 'day':
                        data['day'] = int(row_dict.get('Day', 0)) if row_dict.get('Day', '').isdigit() else 0
                    else:
                        data[col] = row_dict.get(col, '').strip()
                data['group_id'] = int(data.get('group_id', 0)) if data.get('group_id', '').isdigit() else None
                if not data['language'] or data['day'] == 0:
                    continue
                cursor.execute(f'''
                    INSERT INTO Step (
                        {', '.join(columns)}
                    ) VALUES (
                        {', '.join(['?'] * len(columns))}
                    )
                ''', tuple(data.get(col, '') for col in columns))
                rows_uploaded += 1
    except Exception as e:
        print(f"Error uploading data: {e}")
        conn.rollback()
        conn.close()
        return
    conn.commit()
    conn.close()
    print(f"Successfully uploaded {rows_uploaded} steps to Step table!")

def verify_upload():
    """Verify the upload by showing some statistics"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT COUNT(*) FROM Step')
    total_count = cursor.fetchone()[0]
    cursor.execute('SELECT language, COUNT(*) FROM Step GROUP BY language ORDER BY language')
    language_counts = cursor.fetchall()
    cursor.execute('SELECT language, day, COUNT(*) FROM Step GROUP BY language, day ORDER BY language, day')
    day_counts = cursor.fetchall()
    conn.close()
    print(f"\nVerification Results:")
    print(f"Total steps in Step table: {total_count}")
    print(f"\nBy Language:")
    for lang, count in language_counts:
        print(f"  {lang}: {count} steps")
    print(f"\nBy Language and Day:")
    for lang, day, count in day_counts:
        print(f"  {lang} Day {day}: {count} steps")

if __name__ == "__main__":
    print("Creating Step table and uploading steps...")
    create_step_table()
    upload_steps()
    verify_upload()
    print("\nUpload completed successfully!")