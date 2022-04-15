from flask import Blueprint, render_template

game_bp = Blueprint('game', __name__, static_folder='static',
                    template_folder='templates', url_prefix='/game')


@game_bp.route("/")
def index():
    return render_template('game/index.html')
