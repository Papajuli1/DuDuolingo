import sqlite3
import os
import csv

def create_database():
    # Create database directory if it doesn't exist
    db_dir = os.path.dirname(__file__)
    if not os.path.exists(db_dir):
        os.makedirs(db_dir)
    
    # Connect to database (creates file if doesn't exist)
    conn = sqlite3.connect(os.path.join(db_dir, 'duduolingo.db'))
    cursor = conn.cursor()
    
    # Drop table if exists to recreate with fresh data
    cursor.execute('DROP TABLE IF EXISTS word')
    
    # Create word table without category
    cursor.execute('''
        CREATE TABLE word (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            word TEXT NOT NULL,
            word_language TEXT NOT NULL,
            definition TEXT NOT NULL,
            definition_language TEXT NOT NULL,
            level INTEGER NOT NULL
        )
    ''')
    
    # Load Spanish-English vocabulary
    load_csv_data(cursor, 'vocab-ES-EN.csv', 'Spanish', 'English')
    
    # Load German-English vocabulary
    load_csv_data(cursor, 'vocab-DE-EN.csv', 'German', 'English')
    
    # Commit changes and close connection
    conn.commit()
    conn.close()
    print("Database created and CSV data loaded successfully!")

def load_csv_data(cursor, filename, word_lang, def_lang):
    # Get the data directory path
    data_dir = os.path.join(os.path.dirname(__file__), '..', 'data')
    csv_path = os.path.join(data_dir, filename)
    
    if not os.path.exists(csv_path):
        print(f"Warning: {filename} not found at {csv_path}")
        return
    
    try:
        # Open with utf-8-sig to handle BOM automatically
        with open(csv_path, 'r', encoding='utf-8-sig') as file:
            # Skip comment line if it starts with //
            first_line = file.readline().strip()
            if first_line.startswith('//'):
                # Comment line found, continue reading from next line
                pass
            else:
                # No comment line, reset file pointer
                file.seek(0)
            
            csv_reader = csv.DictReader(file)
            word_count = 0
            
            for row in csv_reader:
                word = row['word'].strip().strip('"')
                translation = row['translation'].strip().strip('"')
                
                # Skip empty rows
                if not word or not translation:
                    continue
                
                # Assign level based on word order (groups of 50)
                level = (word_count // 50) + 1
                
                cursor.execute('''
                    INSERT INTO word (word, word_language, definition, definition_language, level)
                    VALUES (?, ?, ?, ?, ?)
                ''', (word, word_lang, translation, def_lang, level))
                
                word_count += 1
            
            print(f"Loaded {word_count} words from {filename}")
    
    except Exception as e:
        print(f"Error loading {filename}: {e}")

if __name__ == "__main__":
    create_database()

