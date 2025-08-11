import sqlite3
import csv
import sys
import os

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from db_helper import get_connection

def create_brick_table():
    """Create the Brick table with appropriate columns"""
    conn = get_connection()
    cursor = conn.cursor()
    
    # Drop table if exists to recreate with fresh data
    cursor.execute('DROP TABLE IF EXISTS Brick')
    
    # Create Brick table matching CSV structure
    cursor.execute('''
        CREATE TABLE Brick (
            group_id INTEGER PRIMARY KEY,
            language TEXT NOT NULL,
            level INTEGER NOT NULL,
            group_number INTEGER NOT NULL,
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
            scene TEXT,
            image TEXT,
            completed INTEGER DEFAULT 0
        )
    ''')
    
    conn.commit()
    conn.close()
    print("Brick table created successfully!")

def upload_word_groups():
    """Upload word_groups.csv data to the Brick table"""
    csv_path = os.path.join(os.path.dirname(__file__), 'word_groups.csv')

    if not os.path.exists(csv_path):
        print(f"CSV file not found: {csv_path}")
        return

    conn = get_connection()
    cursor = conn.cursor()

    # Define the expected columns in order
    columns = [
        'group_id', 'language', 'level', 'group_number',
        'word1', 'definition1', 'type1',
        'word2', 'definition2', 'type2',
        'word3', 'definition3', 'type3',
        'word4', 'definition4', 'type4',
        'word5', 'definition5', 'type5',
        'word6', 'definition6', 'type6',
        'word7', 'definition7', 'type7',
        'word8', 'definition8', 'type8',
        'scene', 'image'
    ]
    # Add completed column
    columns.append('completed')

    rows_uploaded = 0

    try:
        with open(csv_path, 'r', encoding='utf-8') as file:
            first_line = file.readline().strip()
            if first_line.startswith('//'):
                pass
            else:
                file.seek(0)

            csv_reader = csv.reader(file)
            header = next(csv_reader)
            for row in csv_reader:
                # Pad row to expected length (30 columns, completed is added below)
                if len(row) < len(columns) - 1:
                    row += [''] * (len(columns) - 1 - len(row))
                # Prepare data dict
                data = dict(zip(columns[:-1], row))
                # Clean and convert types
                data['group_id'] = int(data.get('group_id', 0)) if data.get('group_id', '').isdigit() else None
                data['language'] = data.get('language', '').strip()
                data['level'] = int(data.get('level', 0)) if data.get('level', '').isdigit() else 0
                data['group_number'] = int(data.get('group_number', 0)) if data.get('group_number', '').isdigit() else 0
                for i in range(1, 9):
                    data[f'word{i}'] = data.get(f'word{i}', '').strip()
                    data[f'definition{i}'] = data.get(f'definition{i}', '').strip().strip('"')
                    data[f'type{i}'] = data.get(f'type{i}', '').strip()
                data['scene'] = data.get('scene', '').strip().strip('"')
                data['image'] = data.get('image', '').strip()
                data['completed'] = 0

                if not data['language'] or data['level'] == 0:
                    continue

                cursor.execute(f'''
                    INSERT INTO Brick (
                        {', '.join(columns)}
                    ) VALUES (
                        {', '.join(['?'] * len(columns))}
                    )
                ''', tuple(data[col] for col in columns))

                rows_uploaded += 1

    except Exception as e:
        print(f"Error uploading data: {e}")
        conn.rollback()
        conn.close()
        return

    conn.commit()
    conn.close()

    print(f"Successfully uploaded {rows_uploaded} word groups to Brick table!")

def verify_upload():
    """Verify the upload by showing some statistics"""
    conn = get_connection()
    cursor = conn.cursor()
    
    # Get total count
    cursor.execute('SELECT COUNT(*) FROM Brick')
    total_count = cursor.fetchone()[0]
    
    # Get count by language
    cursor.execute('SELECT language, COUNT(*) FROM Brick GROUP BY language ORDER BY language')
    language_counts = cursor.fetchall()
    
    # Get count by level
    cursor.execute('SELECT language, level, COUNT(*) FROM Brick GROUP BY language, level ORDER BY language, level')
    level_counts = cursor.fetchall()
    
    conn.close()
    
    print(f"\nVerification Results:")
    print(f"Total word groups in Brick table: {total_count}")
    
    print(f"\nBy Language:")
    for lang, count in language_counts:
        print(f"  {lang}: {count} groups")
    
    print(f"\nBy Language and Level:")
    for lang, level, count in level_counts:
        print(f"  {lang} Level {level}: {count} groups")

if __name__ == "__main__":
    print("Creating Brick table and uploading word groups...")
    
    # Create table
    create_brick_table()
    
    # Upload data
    upload_word_groups()
    
    # Verify upload
    verify_upload()
    
    print("\nUpload completed successfully!")
   
