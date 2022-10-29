from flask_login import UserMixin
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class Patient(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    days_done = db.Column(db.Integer)
    prog_group = db.Column(db.Integer)
    pro_id = db.Column(db.Integer, db.ForeignKey(
        'professional.id'), nullable=False)
    sessions = db.relationship('Session', backref='patient')

    def get_id(self):
        return self.username

    def __repr__(self):
        return '<Patient %r>' % self.username


class Professional(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    patients = db.relationship('Patient', backref='professional')
    programs = db.relationship('Program', backref='professional')

    def get_id(self):
        return self.username

    def __repr__(self):
        return '<Professional %r>' % self.username


class Program(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    prog_group = db.Column(db.Integer)
    week_no = db.Column(db.Integer)
    day_no = db.Column(db.Integer)
    wvi_sets = db.Column(db.Integer)
    wvi_reps = db.Column(db.Integer)
    wvi_dur = db.Column(db.Integer)
    wvo_sets = db.Column(db.Integer)
    wvo_reps = db.Column(db.Integer)
    wvo_dur = db.Column(db.Integer)
    fst_sets = db.Column(db.Integer)
    fst_reps = db.Column(db.Integer)
    fst_dur = db.Column(db.Integer)
    dtp_sets = db.Column(db.Integer)
    dtp_reps = db.Column(db.Integer)
    dtp_dur = db.Column(db.Integer)
    fsd_sets = db.Column(db.Integer)
    fsd_reps = db.Column(db.Integer)
    fsd_dur = db.Column(db.Integer)
    rest_sets = db.Column(db.Integer)
    rest_reps = db.Column(db.Integer)
    pro_id = db.Column(db.Integer, db.ForeignKey(
        'professional.id'), nullable=False)
    sessions = db.relationship('Session', backref='program')

    def __repr__(self):
        return '<Program %r>' % self.id


class Session(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    start_ts = db.Column(db.DateTime)
    end_ts = db.Column(db.DateTime)
    success = db.Column(db.Boolean)
    wvi_sets = db.Column(db.Integer)
    wvo_sets = db.Column(db.Integer)
    fst_sets = db.Column(db.Integer)
    dtp_sets = db.Column(db.Integer)
    fsd_sets = db.Column(db.Integer)
    issue = db.Column(db.String)
    pt_id = db.Column(db.Integer, db.ForeignKey(
        'patient.id'), nullable=False)
    prog_id = db.Column(db.Integer, db.ForeignKey(
        'program.id'), nullable=False)

    def __repr__(self):
        return '<Session %r>' % self.id
