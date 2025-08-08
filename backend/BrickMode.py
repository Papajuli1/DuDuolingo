from flask import jsonify, send_from_directory
import os

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
            from database.db_helper import get_connection
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute('PRAGMA table_info(Brick)')
            columns_info = cursor.fetchall()
            column_names = [col[1] for col in columns_info]
            print(f"Brick table columns: {column_names}")

            cursor.execute('SELECT * FROM Brick')
            bricks = cursor.fetchall()
            conn.close()
            print(f"Found {len(bricks)} bricks")

            brick_list = []
            for brick in bricks:
                brick_dict = dict(zip(column_names, brick))
                # Ensure 'words' is a list of the word columns (adjust names if needed)
                word_keys = [key for key in column_names if key.lower().startswith('word')]
                brick_dict['words'] = [brick_dict[key] for key in word_keys if brick_dict.get(key)]
                # Build image URL from the path stored in the db
                image_path = brick_dict.get('image')
                image_url = None
                if image_path:
                    # Always use the filename, regardless of how it's stored
                    image_filename = os.path.basename(image_path)
                    image_url = f'/data/images/{image_filename}'
                # Optionally, keep only relevant keys for frontend
                filtered_dict = {
                    'id': brick_dict.get('id'),
                    'brick': brick_dict.get('brick'),
                    'brick_language': brick_dict.get('brick_language', ''),
                    'definition': brick_dict.get('definition', ''),
                    'definition_language': brick_dict.get('definition_language', ''),
                    'level': brick_dict.get('level', 1),
                    'image_url': image_url,
                    'words': brick_dict['words']
                }
                brick_list.append(filtered_dict)

            print(f"=== Returning {len(brick_list)} processed bricks ===")
            return jsonify(brick_list)
        except Exception as e:
            print(f"=== ERROR in get_bricks: {str(e)} ===")
            import traceback
            traceback.print_exc()
            return jsonify({'error': str(e), 'type': str(type(e).__name__)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)

