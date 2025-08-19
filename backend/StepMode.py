import os
from flask import jsonify, request
from database.db_helper import get_connection, get_all_steps

def register_step_routes(app):
    @app.route('/api/steps', methods=['GET'])
    def get_steps():
        try:
            steps = get_all_steps()
            return jsonify(steps)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return jsonify({'error': str(e), 'type': str(type(e).__name__)}), 500

    @app.route('/user_steps/reset', methods=['POST'])
    def reset_user_steps_endpoint():
        data = request.get_json()
        username = data.get('username')
        language = data.get('language')
        try:
            reset_user_steps(username, language)
            return jsonify({'success': True})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500

def reset_user_steps(username, language=None):
    conn = get_connection()
    cursor = conn.cursor()
    if language:
        print(f"Resetting UserStep for username={username}, language={language}")
        # Show which group_ids will be affected
        cursor.execute("SELECT group_id FROM Step WHERE language = ?", (language,))
        group_ids = [row[0] for row in cursor.fetchall()]
        print(f"Target group_ids for language '{language}': {group_ids}")
        if not group_ids:
            print("No steps found for this language.")
        cursor.execute(
            "UPDATE UserStep SET score = 0 WHERE username = ? AND group_id IN (SELECT group_id FROM Step WHERE language = ?)",
            (username, language)
        )
        print(f"SQL params: username={username}, language={language}")
    else:
        print(f"Resetting UserStep for username={username}, all languages")
        cursor.execute(
            "UPDATE UserStep SET score = 0 WHERE username = ?",
            (username,)
        )
        print(f"SQL params: username={username}")
    conn.commit()
    conn.close()
    print(f"Rows affected: {cursor.rowcount}")
    conn.commit()
    conn.close()
