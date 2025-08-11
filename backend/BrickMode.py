from flask import jsonify, send_from_directory, request
import os
from database.db_helper import get_connection, set_brick_completed, get_completed_bricks

def register_brick_routes(app):
    @app.route('/api/test', methods=['GET'])
    def test_endpoint():
        return jsonify({'message': 'Backend is working!', 'status': 'success'})
    
    @app.route('/api/debug', methods=['GET'])
    def debug_endpoint():
        # Check if database file exists
        db_path = os.path.join(os.path.dirname(__file__), 'database', 'duduolingo.db')
        db_exists = os.path.exists(db_path)
        
        return jsonify({
            'database_path': db_path,
            'database_exists': db_exists,
            'current_directory': os.getcwd(),
            'files_in_database_dir': os.listdir(os.path.join(os.path.dirname(__file__), 'database')) if os.path.exists(os.path.join(os.path.dirname(__file__), 'database')) else 'database folder not found'
        })
    
    # Serve images from the data/images folder
    @app.route('/data/images/<path:filename>')
    def serve_image(filename):
        image_dir = os.path.join(os.path.dirname(__file__), 'data', 'images')
        return send_from_directory(image_dir, filename)

    @app.route('/api/bricks', methods=['GET'])
    def get_bricks():
        try:
            print("=== Starting get_bricks function ===")
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute('PRAGMA table_info(Brick)')
            columns_info = cursor.fetchall()
            column_names = [col[1] for col in columns_info]
            print(f"Brick table columns: {column_names}")

            if 'completed' not in column_names:
                print("ERROR: 'completed' column missing from Brick table. Please run:")
                print("ALTER TABLE Brick ADD COLUMN completed INTEGER DEFAULT 0;")
                return jsonify({'error': "'completed' column missing from Brick table"}), 500

            try:
                cursor.execute('SELECT * FROM Brick')
                bricks = cursor.fetchall()
            except Exception as sql_err:
                print(f"SQL Error: {sql_err}")
                import traceback
                traceback.print_exc()
                conn.close()
                return jsonify({'error': f'SQL Error: {sql_err}'}), 500

            conn.close()
            print(f"Found {len(bricks)} bricks")

            brick_list = []
            for brick in bricks:
                try:
                    brick_dict = dict(zip(column_names, brick))
                    words = []
                    for i in range(1, 9):  # word1 to word8
                        word_text = brick_dict.get(f'word{i}')
                        word_def = brick_dict.get(f'definition{i}')
                        word_type = brick_dict.get(f'type{i}')
                        if word_text and word_text.strip():
                            words.append({
                                'text': word_text,
                                'definition': word_def if word_def else '',
                                'type': word_type if word_type else ''
                            })
                    image_path = brick_dict.get('image')
                    image_url = None
                    if image_path:
                        image_filename = os.path.basename(image_path)
                        image_url = f'/data/images/{image_filename}'
                    filtered_dict = {
                        'group_id': brick_dict.get('group_id'),
                        'brick': brick_dict.get('brick'),
                        'brick_language': brick_dict.get('language', ''),
                        'definition': brick_dict.get('definition', ''),
                        'definition_language': brick_dict.get('definition_language', ''),
                        'level': brick_dict.get('level', 1),
                        'image_url': image_url,
                        'words': words,
                        'completed': brick_dict.get('completed', 0) == 1
                    }
                    brick_list.append(filtered_dict)
                except Exception as row_err:
                    print(f"Error processing brick row: {row_err}")
                    import traceback
                    traceback.print_exc()
                    continue

            print(f"=== Returning {len(brick_list)} processed bricks ===")
            return jsonify(brick_list)
        except Exception as e:
            print(f"=== ERROR in get_bricks: {str(e)} ===")
            import traceback
            traceback.print_exc()
            return jsonify({'error': str(e), 'type': str(type(e).__name__)}), 500

    # Removed global brick completion logic. Completion is now tracked per user in UserBrick table.

    @app.route('/api/bricks/reset', methods=['POST'])
    def reset_bricks_endpoint():
        data = request.get_json()
        language = data.get('language')
        try:
            reset_bricks(language)
            return jsonify({'success': True})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500

def reset_bricks(language=None):
    conn = get_connection()
    cursor = conn.cursor()
    if language:
        cursor.execute("UPDATE Brick SET completed = 0 WHERE language = ?", (language,))
    else:
        cursor.execute("UPDATE Brick SET completed = 0")
    conn.commit()
    conn.close()

if __name__ == '__main__':
    app.run(debug=True, port=5000)



