from application.models import Patient, Professional, Program, Session
from flask import Blueprint, abort, render_template, request
from flask_login import current_user, login_required

med_bp = Blueprint('med', __name__, static_folder='static',
                   template_folder='templates', url_prefix='/med')


@med_bp.route("/")
@login_required
def index():
    if not Professional.query.filter_by(username=current_user.username).first():
        abort(403)
    return render_template('med/index.html')


@med_bp.route("/patients")
@login_required
def patients():
    if not Professional.query.filter_by(username=current_user.username).first():
        abort(403)
    if (request.args.get('page') is None):
        page = 1
    else:
        page = request.args.get('page', 1, type=int)
    patients = Patient.query.filter_by(pro_id=current_user.id).order_by(
        Patient.username.asc()).paginate(page=page, per_page=10)
    tot_days = []
    for p in patients.items:
        tot_days.append(Program.query.filter_by(
            prog_group=p.prog_group).count())
    return render_template('med/patients.html', patients=patients, tot_days=tot_days)


@med_bp.route("/patients/<username>")
@login_required
def profile(username):
    professional = Professional.query.filter_by(
        username=current_user.username).first()
    if not professional:
        abort(403)
    patient = Patient.query.filter_by(username=username).first()
    if patient.pro_id != professional.id:
        abort(403)
    programs = Program.query.filter_by(
        prog_group=patient.prog_group).order_by(Program.day_no.desc()).all()
    tot_days = len(programs)
    programs = programs[:patient.days_done]
    sessions = Session.query.filter_by(
        pt_id=patient.id).order_by(Session.start_ts.desc()).all()
    return render_template('med/profile.html', patient=patient, tot_days=tot_days, sessions=sessions, programs=programs)


@med_bp.route("/routines")
@login_required
def routines():
    professional = Professional.query.filter_by(
        username=current_user.username).first()
    if not professional:
        abort(403)
    programs = Program.query.filter_by(
        pro_id=professional.id).order_by(Program.day_no.asc()).all()
    programs_dict = {}
    for p in programs:
        if p.prog_group in programs_dict:
            programs_dict[p.prog_group].append(p)
        else:
            programs_dict[p.prog_group] = [p]
    return render_template('med/routines.html', programs_dict=programs_dict)


@med_bp.route("/routines/assign")
@login_required
def assign():
    if not Professional.query.filter_by(username=current_user.username).first():
        abort(403)
    return render_template('med/assign.html')


@med_bp.route("/routines/<int:id>")
@login_required
def details(id):
    if not Professional.query.filter_by(username=current_user.username).first():
        abort(403)
    return render_template('med/details.html', id=id)


@med_bp.route("/routines/new")
@login_required
def create():
    if not Professional.query.filter_by(username=current_user.username).first():
        abort(403)
    return render_template('med/create.html')
