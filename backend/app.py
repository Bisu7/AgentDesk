import os
from flask import Flask, jsonify
from extensions import db, migrate, jwt, cors, socketio
from dotenv import load_dotenv

def create_app():
    load_dotenv()
    app = Flask(__name__)
    
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'postgresql://postgres:password@localhost:5432/ai_customer_support')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'jwt-dev-secret-key')
    
    # Initialize Extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    
    frontend_url = os.environ.get('FRONTEND_URL', '*')
    cors.init_app(app, resources={r"/api/*": {"origins": [frontend_url, "http://localhost:5173"]}})
    
    socketio.init_app(app)

    # JWT Error Handlers for debugging 422 errors
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        print(f"DEBUG: Token expired: {jwt_payload}")
        return jsonify({"message": "The token has expired.", "error": "token_expired"}), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        print(f"DEBUG: Invalid token - {error}")
        return jsonify({"message": f"Signature verification failed: {error}", "error": "invalid_token"}), 422

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        print(f"DEBUG: Missing token - {error}")
        return jsonify({"message": "Request does not contain an access token.", "error": "authorization_required"}), 401
    
    # Register Blueprints
    from routes.auth import auth_bp
    from routes.tickets import tickets_bp
    from routes.chat import chat_bp
    from routes.admin import admin_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(tickets_bp, url_prefix='/api/tickets')
    app.register_blueprint(chat_bp, url_prefix='/api/chat')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    
    # We must import models for migrate to detect them
    with app.app_context():
        import models

    @app.route('/')
    def index():
        return {'message': 'Welcome to the AI Customer Support API. Use /health to check status.'}

    @app.route('/health')
    def health_check():
        return {'status': 'healthy'}
        
    return app

if __name__ == '__main__':
    app = create_app()
    port = int(os.environ.get('PORT', 5000))
    socketio.run(app, host='0.0.0.0', port=port, debug=True, allow_unsafe_werkzeug=True)
