from flask_wtf import FlaskForm
from werkzeug.security import check_password_hash
from wtforms import PasswordField, RadioField, StringField
from wtforms.validators import EqualTo, InputRequired, Length, ValidationError

from application.models import Patient, Professional


class RegistrationForm(FlaskForm):
    username = StringField(
        "Username",
        [
            InputRequired(),
            Length(
                min=4,
                max=25,
                message="Username must be between 4 and 25 characters long.",
            ),
        ],
    )

    def validate_username(form, field):
        if (
            Patient.query.filter_by(username=field.data).first()
            or Professional.query.filter_by(username=field.data).first()
        ):
            raise ValidationError("Username is already in use.")

    password = PasswordField(
        "New Password",
        [InputRequired(), EqualTo("confirm", message="Passwords must match.")],
    )
    confirm = PasswordField("Repeat Password")

    professional = StringField("If not, enter your therapist's username.")

    def validate_professional(form, field):
        if form.user_type.data == "professional" and field.data != "":
            raise ValidationError(
                "If you are a health professional you should leave the last field empty."
            )
        elif form.user_type.data == "patient":
            if field.data == "":
                raise ValidationError("Health professional username is required.")
            elif not Professional.query.filter_by(username=field.data).first():
                raise ValidationError(
                    "Username for health professional does not exist."
                )

    user_type = RadioField(
        "Are you a therapist?",
        choices=[("patient", "No"), ("professional", "Yes")],
        validators=[InputRequired()],
    )


class LoginForm(FlaskForm):
    def validate_login(form, field):
        user = (
            Patient.query.filter_by(username=form.username.data).first()
            or Professional.query.filter_by(username=form.username.data).first()
        )

        if user is None:
            raise ValidationError(f'User "{form.username.data}" does not exist.')
        elif not check_password_hash(user.password, form.password.data):
            raise ValidationError("Invalid password.")

    username = StringField("Username", [InputRequired()])

    password = PasswordField("Password", [InputRequired(), validate_login])
