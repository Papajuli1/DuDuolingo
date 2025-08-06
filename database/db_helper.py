import sqlite3
import os

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

def get_levels_by_language(language):
    """Get all available levels for a language"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT DISTINCT level FROM word 
        WHERE word_language = ? 
        ORDER BY level
    ''', (language,))
    levels = [row[0] for row in cursor.fetchall()]
    conn.close()
    return levels

def create_level_entry(language, level_number, sentence_prompt, word_ids, image_path=None):
    """Create a new level entry"""
    # Get language prefix (first 2 letters)
    lang_prefix = language[:2].upper()
    
    conn = get_connection()
    cursor = conn.cursor()
    
    # Find the next sequence number for this language and level
    cursor.execute('''
        SELECT COUNT(*) FROM levels 
        WHERE language = ? AND level_number = ?
    ''', (language, level_number))
    
    sequence_count = cursor.fetchone()[0]
    sequence_number = sequence_count + 1
    
    # Create level_id in format: SP-1-1, SP-1-2, etc.
    level_id = f"{lang_prefix}-{level_number}-{sequence_number}"
    
    # Insert new level (no update logic since each entry is unique)
    cursor.execute('''
        INSERT INTO levels (level_id, language, level_number, sentence_prompt, word_ids, image_path)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (level_id, language, level_number, sentence_prompt, word_ids, image_path))
    
    conn.commit()
    conn.close()
    return level_id

def get_level_by_id(level_id):
    """Get a specific level by ID"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM levels WHERE level_id = ?', (level_id,))
    level = cursor.fetchone()
    conn.close()
    return level

def get_all_levels():
    """Get all levels"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM levels ORDER BY language, level_number')
    levels = cursor.fetchall()
    conn.close()
    return levels

def get_levels_by_language_name(language):
    """Get all levels for a specific language"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT * FROM levels 
        WHERE language = ? 
        ORDER BY level_number
    ''', (language,))
    levels = cursor.fetchall()
    conn.close()
    return levels

def get_levels_by_language_and_level(language, level_number):
    """Get all level entries for a specific language and level number"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT * FROM levels 
        WHERE language = ? AND level_number = ?
        ORDER BY level_id
    ''', (language, level_number))
    levels = cursor.fetchall()
    conn.close()
    return levels

def get_max_sequence_for_level(language, level_number):
    """Get the maximum sequence number for a specific language and level"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT COUNT(*) FROM levels 
        WHERE language = ? AND level_number = ?
    ''', (language, level_number))
    count = cursor.fetchone()[0]
    conn.close()
    return count
