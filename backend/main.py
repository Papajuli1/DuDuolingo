from flask import Flask, send_from_directory
from flask_cors import CORS
from BrickMode import register_brick_routes
from database.user import user_bp
from MoonDream import detect_bp
from StepMode import register_step_routes

def create_app():
    app = Flask(__name__)
    CORS(app)
    # Register route modules
    register_brick_routes(app)
    register_step_routes(app)
    # Register user routes
    app.register_blueprint(user_bp)
    app.register_blueprint(detect_bp)

    # --- Serve video files ---
    @app.route('/data/videos/<filename>')
    def serve_video(filename):
        return send_from_directory('data/videos', filename)
    # ------------------------

    # --- Serve sound files ---
    @app.route('/sound/<filename>')
    def serve_sound(filename):
        return send_from_directory('data/sounds', filename)
    # ------------------------

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)
    app = create_app()
    app.run(debug=True, port=5000)
