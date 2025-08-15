import os
from flask import jsonify, request
from database.db_helper import get_connection

def register_step_routes(app):
    @app.route('/api/steps', methods=['GET'])
    def get_steps():
        try:
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute('PRAGMA table_info(Step)')
            columns_info = cursor.fetchall()
            column_names = [col[1] for col in columns_info]
            cursor.execute('SELECT * FROM Step')
            steps = cursor.fetchall()
            conn.close()
            step_list = []
            for step in steps:
                step_dict = dict(zip(column_names, step))
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
                    image_filename = os.path.basename(image_path)
                    image_url = f'/data/images/{image_filename}'

                # Determine if step is completed (all good words pressed)
                completed = step_dict.get('completed', 0)
                show_video = bool(completed)

                step_list.append({
                    'group_id': step_dict.get('group_id'),
                    'language': step_dict.get('language', ''),
                    'day': step_dict.get('day', 1),
                    'image_url': image_url if not show_video else None,
                    'words': words,
                    'video': step_dict.get('video', '') if show_video else None,
                    'show_video': show_video,
                })
            return jsonify(step_list)
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
    print(f"Rows affected: {cursor.rowcount}")
    conn.commit()
    conn.close()
