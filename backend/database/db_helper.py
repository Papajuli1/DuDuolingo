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

