from flask import Flask
from flask_cors import CORS
from BrickMode import register_brick_routes

def create_app():
    app = Flask(__name__)
    CORS(app)
    
    # Register route modules
    register_brick_routes(app)
    
    # Add other route registrations here as you expand
    # register_word_routes(app)
    # register_user_routes(app)
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)
