from flask_wtf import FlaskForm
from wtforms import PasswordField, RadioField, StringField
from wtforms.validators import (Email, EqualTo, InputRequired, Length,
                                ValidationError)

from application.models import Patient, Professional


class RegistrationForm(FlaskForm):
    username = StringField('Username', [InputRequired(), Length(
        min=4, max=25, message='Username must be between 4 and 25 characters long.')])

    def validate_username(form, field):
        if Patient.query.filter_by(username=field.data).first() or Professional.query.filter_by(username=field.data).first():
            raise ValidationError('Username is already in use.')

    email = StringField(
        'Email Address', [InputRequired(), Email()])

    def validate_email(form, field):
        if Patient.query.filter_by(email=field.data).first() or Professional.query.filter_by(email=field.data).first():
            raise ValidationError('Email is already in use.')

    password = PasswordField('New Password', [InputRequired(), EqualTo(
        'confirm', message='Passwords must match.')])
    confirm = PasswordField('Repeat Password')

    professional = StringField(
        'If not, enter your therapist\'s username.')

    def validate_professional(form, field):
        if form.user_type.data == 'professional' and field.data != '':
            raise ValidationError(
                'If you are a health professional you should leave the last field empty.')
        elif form.user_type.data == 'patient':
            if field.data == '':
                raise ValidationError(
                    'Health professional username is required.')
            elif not Professional.query.filter_by(username=field.data).first():
                raise ValidationError(
                    'Username for health professional does not exist.')

    user_type = RadioField('Are you a therapist?', choices=[(
        'patient', 'No'), ('professional', 'Yes')], validators=[InputRequired()])


class LoginForm(FlaskForm):
    username = StringField('Username', [InputRequired()])
    password = PasswordField('Password', [InputRequired()])
