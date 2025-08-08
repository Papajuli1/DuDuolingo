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
            image TEXT
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
    
    # Read and upload CSV data
    rows_uploaded = 0
    
    try:
        with open(csv_path, 'r', encoding='utf-8') as file:
            # Skip comment line if it exists
            first_line = file.readline().strip()
            if first_line.startswith('//'):
                # Comment line found, continue reading from next line
                pass
            else:
                # No comment line, reset file pointer
                file.seek(0)
            
            csv_reader = csv.DictReader(file)
            
            for row in csv_reader:
                # Clean and prepare data
                data = {
                    'group_id': int(row.get('group_id', 0)) if row.get('group_id', '').isdigit() else None,
                    'language': row.get('language', '').strip(),
                    'level': int(row.get('level', 0)) if row.get('level', '').isdigit() else 0,
                    'group_number': int(row.get('group_number', 0)) if row.get('group_number', '').isdigit() else 0,
                    'word1': row.get('word1', '').strip(),
                    'definition1': row.get('definition1', '').strip().strip('"'),
                    'type1': row.get('type1', '').strip(),
                    'word2': row.get('word2', '').strip(),
                    'definition2': row.get('definition2', '').strip().strip('"'),
                    'type2': row.get('type2', '').strip(),
                    'word3': row.get('word3', '').strip(),
                    'definition3': row.get('definition3', '').strip().strip('"'),
                    'type3': row.get('type3', '').strip(),
                    'word4': row.get('word4', '').strip(),
                    'definition4': row.get('definition4', '').strip().strip('"'),
                    'type4': row.get('type4', '').strip(),
                    'word5': row.get('word5', '').strip(),
                    'definition5': row.get('definition5', '').strip().strip('"'),
                    'type5': row.get('type5', '').strip(),
                    'word6': row.get('word6', '').strip(),
                    'definition6': row.get('definition6', '').strip().strip('"'),
                    'type6': row.get('type6', '').strip(),
                    'word7': row.get('word7', '').strip(),
                    'definition7': row.get('definition7', '').strip().strip('"'),
                    'type7': row.get('type7', '').strip(),
                    'word8': row.get('word8', '').strip(),
                    'definition8': row.get('definition8', '').strip().strip('"'),
                    'type8': row.get('type8', '').strip(),
                    'scene': row.get('scene', '').strip().strip('"'),
                    'image': row.get('image', '').strip()
                }
                
                # Skip rows with missing essential data
                if not data['language'] or data['level'] == 0:
                    continue
                
                # Insert into database
                cursor.execute('''
                    INSERT INTO Brick (
                        group_id, language, level, group_number,
                        word1, definition1, type1,
                        word2, definition2, type2,
                        word3, definition3, type3,
                        word4, definition4, type4,
                        word5, definition5, type5,
                        word6, definition6, type6,
                        word7, definition7, type7,
                        word8, definition8, type8,
                        scene, image
                    ) VALUES (
                        ?, ?, ?, ?,
                        ?, ?, ?,
                        ?, ?, ?,
                        ?, ?, ?,
                        ?, ?, ?,
                        ?, ?, ?,
                        ?, ?, ?,
                        ?, ?, ?,
                        ?, ?, ?,
                        ?, ?
                    )
                ''', (
                    data['group_id'], data['language'], data['level'], data['group_number'],
                    data['word1'], data['definition1'], data['type1'],
                    data['word2'], data['definition2'], data['type2'],
                    data['word3'], data['definition3'], data['type3'],
                    data['word4'], data['definition4'], data['type4'],
                    data['word5'], data['definition5'], data['type5'],
                    data['word6'], data['definition6'], data['type6'],
                    data['word7'], data['definition7'], data['type7'],
                    data['word8'], data['definition8'], data['type8'],
                    data['scene'], data['image']
                ))
                
                rows_uploaded += 1
    
    except Exception as e:
        print(f"Error uploading data: {e}")
        conn.rollback()
        conn.close()
        return
    
    # Commit changes
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
