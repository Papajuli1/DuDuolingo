from flask import Flask
from flask_cors import CORS
from BrickMode import register_brick_routes
from database.user import user_bp
from MoonDream import detect_bp

def create_app():
    app = Flask(__name__)
    CORS(app)
    # Register route modules
    register_brick_routes(app)
    # Register user routes
    app.register_blueprint(user_bp)
    app.register_blueprint(detect_bp)
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)
