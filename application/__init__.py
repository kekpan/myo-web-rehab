from flask import Flask
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


def create_app():

    app = Flask(__name__, instance_relative_config=True)
    app.config.from_pyfile('config.py')

    db.init_app(app)

    from application.game import game_bp
    app.register_blueprint(game_bp)

    return app
