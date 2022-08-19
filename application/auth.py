from flask_login import LoginManager

from application.models import Patient, Professional

login_manager = LoginManager()
login_manager.login_view = "home.login"
login_manager.login_message = ['Please log in to access this page.']
login_manager.login_message_category = 'warning'


@login_manager.user_loader
def load_user(username):
    return Patient.query.filter_by(username=username).first() or Professional.query.filter_by(username=username).first()
