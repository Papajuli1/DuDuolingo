from flask import Blueprint, request, jsonify
import sqlite3
import os
from database.db_helper import get_connection

user_bp = Blueprint('user', __name__)

# Leaderboard route (now after user_bp definition)
@user_bp.route('/leaderboard', methods=['GET'])
def leaderboard():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT username, total_score FROM User ORDER BY total_score DESC LIMIT 10')
    top_users = [{'username': row[0], 'total_score': row[1]} for row in cursor.fetchall()]
    conn.close()
    return jsonify({'leaderboard': top_users})

def ensure_user_tables(conn):
    cursor = conn.cursor()
    cursor.execute('''CREATE TABLE IF NOT EXISTS User (username TEXT PRIMARY KEY, total_score INTEGER DEFAULT 0)''')
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
    total_score = 0
    for group_id in brick_ids:
        score = user_scores.get(group_id, 0)
        total_score += score
        result.append({'group_id': group_id, 'score': score})
    # Update total_score in User table
    cursor.execute('UPDATE User SET total_score = ? WHERE username = ?', (total_score, username))
    conn.commit()
    conn.close()
    return jsonify({'username': username, 'bricks': result, 'total_score': total_score})

@user_bp.route('/user_brick', methods=['POST'])
def update_user_brick():
    data = request.get_json()
    username = data.get('username')
    group_id = data.get('group_id')
    try:
        score = float(data.get('score', 0))
    except (TypeError, ValueError):
        score = 0.0
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
    # Recalculate total_score
    cursor.execute('SELECT SUM(score) FROM UserBrick WHERE username = ?', (username,))
    total_score = cursor.fetchone()[0] or 0
    cursor.execute('UPDATE User SET total_score = ? WHERE username = ?', (total_score, username))
    conn.commit()
    # Return the updated score and total_score
    cursor.execute('SELECT score FROM UserBrick WHERE username = ? AND group_id = ?', (username, group_id))
    updated_score = cursor.fetchone()[0]
    conn.close()
    return jsonify({'success': True, 'score': updated_score, 'total_score': total_score})

@user_bp.route('/user_bricks/reset', methods=['POST'])
def reset_user_bricks():
    data = request.get_json()
    username = data.get('username')
    language = data.get('language')
    print(f"[DEBUG] Resetting user bricks for username={username}, language={language}")
    if not username:
        return jsonify({'error': 'Missing username'}), 400
    conn = get_db()
    cursor = conn.cursor()
    # Get all group_ids for the selected language
    # Only reset existing UserBrick rows for this user and language
    if language:
        cursor.execute('SELECT group_id FROM Brick WHERE language = ?', (language,))
        valid_group_ids = set(row[0] for row in cursor.fetchall())
        cursor.execute('SELECT group_id FROM UserBrick WHERE username = ?', (username,))
        user_group_ids = [row[0] for row in cursor.fetchall()]
        group_ids_to_reset = [gid for gid in user_group_ids if gid in valid_group_ids]
    else:
        cursor.execute('SELECT group_id FROM UserBrick WHERE username = ?', (username,))
        group_ids_to_reset = [row[0] for row in cursor.fetchall()]
    print(f"[DEBUG] Found group_ids to reset: {group_ids_to_reset}")
    for group_id in group_ids_to_reset:
        cursor.execute('UPDATE UserBrick SET score = 0 WHERE username = ? AND group_id = ?', (username, group_id))
        print(f"[DEBUG] Updated UserBrick: username={username}, group_id={group_id}")
    # Reset total_score
    cursor.execute('UPDATE User SET total_score = 0 WHERE username = ?', (username,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})