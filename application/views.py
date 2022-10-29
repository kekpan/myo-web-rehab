import functools

from flask import Blueprint, flash, redirect, render_template, request, url_for
from flask_login import current_user, login_required, login_user, logout_user
from werkzeug.security import check_password_hash, generate_password_hash

from application.forms import LoginForm, RegistrationForm
from application.models import Patient, Professional, db

home_bp = Blueprint('home', __name__)


@home_bp.route('/')
def index():
    if current_user.is_authenticated and not hasattr(current_user, 'pro_id'):
        pending = Patient.query.filter_by(
            pro_id=current_user.id, prog_group=None).count()
    else:
        pending = 0
    return render_template('index.html', pending=pending)


def logout_required(view):
    @functools.wraps(view)
    def wrapped_view(**kwargs):
        if current_user.is_authenticated:
            flash(
                [f'You are already logged in, {current_user.username}.'], category='warning')
            return redirect(url_for('home.index'))

        return view(**kwargs)

    return wrapped_view


@home_bp.route('/login', methods=('GET', 'POST'))
@logout_required
def login():
    form = LoginForm(request.form)
    if request.method == 'POST':
        if form.validate_on_submit():
            error = None
            user = Patient.query.filter_by(username=form.username.data).first(
            ) or Professional.query.filter_by(username=form.username.data).first()

            if user is None:
                error = [f'User "{form.username.data}" does not exist.']
            elif not check_password_hash(user.password, form.password.data):
                error = ['Invalid password.']

            if error is None:
                login_user(user, remember=True)
                flash(
                    [f'You were successfully logged in, {user.username}.'], category='success')
                return redirect(url_for('home.index'))

        flash(error, category='danger')

    return render_template('login.html', form=form)


@home_bp.route('/register', methods=('GET', 'POST'))
@logout_required
def register():
    form = RegistrationForm(request.form)
    if request.method == 'POST':
        if form.validate_on_submit():
            if form.user_type.data == 'professional':
                user = Professional(username=form.username.data, email=form.email.data, password=generate_password_hash(
                    form.password.data))
            else:
                pro_id = Professional.query.filter_by(
                    username=form.professional.data).first().id
                user = Patient(username=form.username.data, email=form.email.data, password=generate_password_hash(
                    form.password.data), pro_id=pro_id, days_done=0)
            db.session.add(user)
            db.session.commit()
            flash([f'Thanks for registering. You are now logged in.'],
                  category='success')
            login_user(user, remember=True)
            return redirect(url_for('home.index'))

        for error in form.errors.values():
            flash(error, category='danger')

    return render_template('register.html', form=form)


@home_bp.route('/logout')
@login_required
def logout():
    logout_user()
    flash(['You were successfully logged out.'], category='success')
    return redirect(url_for('home.index'))
