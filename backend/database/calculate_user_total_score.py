import sqlite3
import sys

DB_PATH = 'c:/Users/Yonatan/Desktop/Semester2/IdeaToReality/DuDuolingo/backend/database/duduolingo.db'

def calculate_total_score(username):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('SELECT SUM(score) FROM UserBrick WHERE username = ?', (username,))
    total_score = cursor.fetchone()[0] or 0
    conn.close()
    return total_score

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Usage: python calculate_user_total_score.py <username>')
        sys.exit(1)
    username = sys.argv[1]
    score = calculate_total_score(username)
    print(f'Total score for user "{username}": {score}')
