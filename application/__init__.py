from flask import Flask


def build_app():

    app = Flask(__name__, instance_relative_config=True)
    app.config.from_pyfile('config.py')

    from application.models import db
    db.init_app(app)
    from application.auth import login_manager
    login_manager.init_app(app)

    from application.views import home_bp
    app.register_blueprint(home_bp)
    from application.game import game_bp
    app.register_blueprint(game_bp)
    from application.api import api_bp
    app.register_blueprint(api_bp)
    from application.med import med_bp
    app.register_blueprint(med_bp)

    return app
