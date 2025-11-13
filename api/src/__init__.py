from flask import Flask
from flask_cors import CORS

from .routes.auth_route import auth_bp
from .routes.user_route import user_bp

def create_app():

    app = Flask(__name__)

    CORS(app)

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(user_bp, url_prefix='/api/user')

    return app