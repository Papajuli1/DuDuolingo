@user_bp.route('/user_bricks/reset', methods=['POST'])
def reset_user_bricks():
    print(f"[DEBUG] Resetting user bricks for username={username}, language={language}")
    data = request.get_json()
    username = data.get('username')
    language = data.get('language')
    if not username:
        return jsonify({'error': 'Missing username'}), 400
    conn = get_db()
    cursor = conn.cursor()
    # Get all group_ids for the selected language
    if language:
        cursor.execute('SELECT group_id FROM Brick WHERE language = ? OR brick_language = ?', (language, language))
    else:
        cursor.execute('SELECT group_id FROM Brick')
    group_ids = [row[0] for row in cursor.fetchall()]
    print(f"[DEBUG] Found group_ids: {group_ids}")
    # Reset scores for this user and these bricks
    for group_id in group_ids:
        cursor.execute('SELECT * FROM UserBrick WHERE username = ? AND group_id = ?', (username, group_id))
        exists = cursor.fetchone()
        if exists:
            cursor.execute('UPDATE UserBrick SET score = 0 WHERE username = ? AND group_id = ?', (username, group_id))
            print(f"[DEBUG] Updated UserBrick: username={username}, group_id={group_id}")
        else:
            cursor.execute('INSERT INTO UserBrick (username, group_id, score) VALUES (?, ?, 0)', (username, group_id))
            print(f"[DEBUG] Inserted UserBrick: username={username}, group_id={group_id}")
    conn.commit()
    conn.close()
    return jsonify({'success': True})

from flask import Blueprint, request, jsonify
import sqlite3
import os
from database.db_helper import get_connection

user_bp = Blueprint('user', __name__)

def ensure_user_tables(conn):
    cursor = conn.cursor()
    cursor.execute('''CREATE TABLE IF NOT EXISTS User (username TEXT PRIMARY KEY)''')
    cursor.execute('''CREATE TABLE IF NOT EXISTS UserBrick (
        username TEXT,
        group_id INTEGER,
        score INTEGER DEFAULT 0,
        PRIMARY KEY (username, group_id),
        FOREIGN KEY (username) REFERENCES User(username)
    )''')
    conn.commit()

def get_db():
    conn = get_connection()
    ensure_user_tables(conn)
    return conn

@user_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username', '').strip()
    if not username:
        return jsonify({'error': 'Username required'}), 400
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT username FROM User WHERE username = ?', (username,))
    user = cursor.fetchone()
    if user:
        status = 'existing'
    else:
        cursor.execute('INSERT INTO User (username) VALUES (?)', (username,))
        conn.commit()
        status = 'new'
    conn.close()
    return jsonify({'status': status, 'username': username})

@user_bp.route('/user_bricks/<username>', methods=['GET'])
def user_bricks(username):
    conn = get_db()
    cursor = conn.cursor()
    # Get all bricks
    cursor.execute('SELECT group_id FROM Brick')
    brick_ids = [row[0] for row in cursor.fetchall()]
    # Get user scores
    cursor.execute('SELECT group_id, score FROM UserBrick WHERE username = ?', (username,))
    user_scores = {row[0]: row[1] for row in cursor.fetchall()}
    # Build result
    result = []
    for group_id in brick_ids:
        score = user_scores.get(group_id, 0)
        result.append({'group_id': group_id, 'score': score})
    conn.close()
    return jsonify({'username': username, 'bricks': result})

@user_bp.route('/user_brick', methods=['POST'])
def update_user_brick():
    data = request.get_json()
    username = data.get('username')
    group_id = data.get('group_id')
    score = data.get('score', 0)
    if not username or group_id is None:
        return jsonify({'error': 'Missing username or group_id'}), 400
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM UserBrick WHERE username = ? AND group_id = ?', (username, group_id))
    exists = cursor.fetchone()
    if exists:
        cursor.execute('UPDATE UserBrick SET score = ? WHERE username = ? AND group_id = ?', (score, username, group_id))
    else:
        cursor.execute('INSERT INTO UserBrick (username, group_id, score) VALUES (?, ?, ?)', (username, group_id, score))
    conn.commit()
    conn.close()
    return jsonify({'success': True})
