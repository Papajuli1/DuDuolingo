import sqlite3
import os
import sys

DATABASE_PATH = os.path.join(os.path.dirname(__file__), 'duduolingo.db')

def get_connection():
    """Get database connection"""
    return sqlite3.connect(DATABASE_PATH)

def get_words_by_level(level_start, level_end):
    """Get words within a level range"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT * FROM word 
        WHERE level BETWEEN ? AND ?
        ORDER BY level
    ''', (level_start, level_end))
    words = cursor.fetchall()
    conn.close()
    return words

def get_words_by_language(word_language):
    """Get words by language"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM word WHERE word_language = ?', (word_language,))
    words = cursor.fetchall()
    conn.close()
    return words

def get_random_words(language, limit=10):
    """Get random words for practice"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT * FROM word 
        WHERE word_language = ? 
        ORDER BY RANDOM() 
        LIMIT ?
    ''', (language, limit))
    words = cursor.fetchall()
    conn.close()
    return words

def search_words(search_term):
    """Search words by term"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT * FROM word 
        WHERE word LIKE ? OR definition LIKE ?
        ORDER BY word
    ''', (f'%{search_term}%', f'%{search_term}%'))
    words = cursor.fetchall()
    conn.close()
    return words

def get_word_count():
    """Get total word count"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT COUNT(*) FROM word')
    count = cursor.fetchone()[0]
    conn.close()
    return count

def add_word(word, word_language, definition, definition_language, level):
    """Add a new word to the database"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO word (word, word_language, definition, definition_language, level)
        VALUES (?, ?, ?, ?, ?)
    ''', (word, word_language, definition, definition_language, level))
    conn.commit()
    conn.close()

def get_word_by_id(word_id):
    """Get a specific word by ID"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM word WHERE id = ?', (word_id,))
    word = cursor.fetchone()
    conn.close()
    return word

def get_all_bricks():
    """Get all bricks from the database"""
    conn = get_connection()
    cursor = conn.cursor()
    # First get table info to see column names
    cursor.execute('PRAGMA table_info(Brick)')
    columns = cursor.fetchall()
    print(f"Brick table columns: {columns}")
    
    # Simple SELECT without ORDER BY to avoid column name issues
    cursor.execute('SELECT * FROM Brick')
    bricks = cursor.fetchall()
    conn.close()
    return bricks

def get_brick_by_id(brick_id):
    """Get a specific brick by ID"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM Brick WHERE id = ?', (brick_id,))
    brick = cursor.fetchone()
    conn.close()
    return brick

def get_bricks_by_level(level_start, level_end):
    """Get bricks within a level range"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT * FROM Brick 
        WHERE level BETWEEN ? AND ?
        ORDER BY level
    ''', (level_start, level_end))
    bricks = cursor.fetchall()
    conn.close()
    return bricks

def get_bricks_by_language(brick_language):
    """Get bricks by language"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM Brick WHERE brick_language = ?', (brick_language,))
    bricks = cursor.fetchall()
    conn.close()
    return bricks

def get_random_bricks(language, limit=10):
    """Get random bricks for practice"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT * FROM Brick 
        WHERE brick_language = ? 
        ORDER BY RANDOM() 
        LIMIT ?
    ''', (language, limit))
    bricks = cursor.fetchall()
    conn.close()
    return bricks

def search_bricks(search_term):
    """Search bricks by term"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT * FROM Brick 
        WHERE brick LIKE ? OR definition LIKE ?
        ORDER BY brick
    ''', (f'%{search_term}%', f'%{search_term}%'))
    bricks = cursor.fetchall()
    conn.close()
    return bricks

def get_brick_count():
    """Get total brick count"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT COUNT(*) FROM Brick')
    count = cursor.fetchone()[0]
    conn.close()
    return count

def add_brick(brick, brick_language, definition, definition_language, level):
    """Add a new brick to the database"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO Brick (brick, brick_language, definition, definition_language, level, completed)
        VALUES (?, ?, ?, ?, ?, 0)
    ''', (brick, brick_language, definition, definition_language, level))
    conn.commit()
    conn.close()

def set_brick_completed(group_id, completed=True):
    """Mark a brick as completed (requires 'completed' column in Brick table)"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('UPDATE Brick SET completed = ? WHERE group_id = ?', (int(completed), group_id))
    conn.commit()
    conn.close()

def get_completed_bricks():
    """Get IDs of completed bricks"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT id FROM Brick WHERE completed = 1')
    ids = [row[0] for row in cursor.fetchall()]
    conn.close()
    return ids

def get_all_steps():
    """Get all steps from the Step table"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('PRAGMA table_info(Step)')
    columns_info = cursor.fetchall()
    column_names = [col[1] for col in columns_info]
    cursor.execute('SELECT * FROM Step')
    steps = cursor.fetchall()
    conn.close()
    step_list = []
    print("DEBUG: get_all_steps called")  # Confirm function is running
    sys.stdout.flush()
    for step in steps:
        print("\n--- STEP DEBUG ---")
        step_dict = dict(zip(column_names, step))
        print("DEBUG step_dict:", step_dict)
        sys.stdout.flush()
        words = []
        for i in range(1, 9):
            word_text = step_dict.get(f'word{i}')
            word_def = step_dict.get(f'definition{i}')
            word_type = step_dict.get(f'type{i}')
            if word_text and word_text.strip():
                words.append({
                    'text': word_text,
                    'definition': word_def if word_def else '',
                    'type': word_type if word_type else ''
                })
        image_path = step_dict.get('image')
        image_url = None
        if image_path:
            import os
            image_filename = os.path.basename(image_path)
            image_url = f'/data/images/{image_filename}'
        # Find the correct key for the video field from the debug output
        video_path = step_dict.get('video')  # Change 'video' to the actual key if needed
        video_url = None
        if video_path and video_path.strip():
            import os
            video_filename = os.path.basename(video_path.strip())
            video_url = f'/data/videos/{video_filename}'
        step_list.append({
            'group_id': step_dict.get('group_id'),
            'language': step_dict.get('language', ''),
            'day': step_dict.get('day', 1),
            'image_url': image_url,
            'words': words,
            'video': video_url
        })
    print("DEBUG: get_all_steps finished")
    sys.stdout.flush()
    return step_list

