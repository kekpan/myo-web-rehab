from application.models import Patient, Professional, Program, Session, db
from flask import (Blueprint, abort, flash, redirect, render_template, request,
                   url_for)
from flask_login import current_user, login_required

from .forms import ProgramForm

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
    if not patient:
        abort(404)
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


@med_bp.route("/routines/assign", methods=('GET', 'POST'))
@login_required
def assign():
    professional = Professional.query.filter_by(
        username=current_user.username).first()
    if not professional:
        abort(403)
    if request.method == 'POST':
        patient = Patient.query.filter_by(
            username=request.form['username']).first()
        patient.prog_group = request.form['program']
        db.session.add(patient)
        db.session.commit()
        flash(
            [f'Routine successfully assigned to {patient.username}.'], category='success')
        return redirect(url_for('med.patients'))
    programs = Program.query.filter_by(
        pro_id=professional.id).order_by(Program.day_no.asc()).all()
    programs_dict = {}
    for p in programs:
        if p.prog_group in programs_dict:
            programs_dict[p.prog_group].append(p)
        else:
            programs_dict[p.prog_group] = [p]
    if (request.args.get('user') is None):
        username = ""
    else:
        username = request.args.get('user')
    return render_template('med/assign.html', programs_dict=programs_dict, username=username)


@med_bp.route("/routines/<int:id>")
@login_required
def details(id):
    professional = Professional.query.filter_by(
        username=current_user.username).first()
    if not professional:
        abort(403)
    programs = Program.query.filter_by(prog_group=id).all()
    if not programs:
        abort(404)
    if programs[0].pro_id != professional.id:
        abort(403)
    return render_template('med/details.html', programs=programs)


@med_bp.route("/routines/new", methods=("GET", "POST"))
@login_required
def create():
    if not Professional.query.filter_by(username=current_user.username).first():
        abort(403)
    form = ProgramForm(request.form)
    if request.method == 'POST':
        if form.validate_on_submit():
            i = 1
            prog_group = Program.query.order_by(
                Program.prog_group.desc()).first().prog_group + 1
            error = None
            for w in range(1, 5):
                for d in range(1, 8):
                    program = Program(week_no=w, day_no=i, pro_id=Professional.query.filter_by(
                        username=current_user.username).first().id)
                    error = (form['wvi_'+str(w)+str(d)].data == '' or form['wvo_'+str(w)+str(d)].data == '' or form['fst_'+str(w)+str(d)].data ==
                             '' or form['fsd_'+str(w)+str(d)].data == '' or form['dtp_'+str(w)+str(d)].data == '' or form['rst_'+str(w)+str(d)].data == '')
                    if error:
                        continue
                    program.wvi_sets = form['wvi_' +
                                            str(w)+str(d)].data.split()[0]
                    program.wvi_reps = form['wvi_' +
                                            str(w)+str(d)].data.split()[1]
                    program.wvi_dur = form['wvi_' +
                                           str(w)+str(d)].data.split()[2]
                    program.wvo_sets = form['wvo_' +
                                            str(w)+str(d)].data.split()[0]
                    program.wvo_reps = form['wvo_' +
                                            str(w)+str(d)].data.split()[1]
                    program.wvo_dur = form['wvo_' +
                                           str(w)+str(d)].data.split()[2]
                    program.fst_sets = form['fst_' +
                                            str(w)+str(d)].data.split()[0]
                    program.fst_reps = form['fst_' +
                                            str(w)+str(d)].data.split()[1]
                    program.fst_dur = form['fst_' +
                                           str(w)+str(d)].data.split()[2]
                    program.dtp_sets = form['dtp_' +
                                            str(w)+str(d)].data.split()[0]
                    program.dtp_reps = form['dtp_' +
                                            str(w)+str(d)].data.split()[1]
                    program.dtp_dur = form['dtp_' +
                                           str(w)+str(d)].data.split()[2]
                    program.fsd_sets = form['fsd_' +
                                            str(w)+str(d)].data.split()[0]
                    program.fsd_reps = form['fsd_' +
                                            str(w)+str(d)].data.split()[1]
                    program.fsd_dur = form['fsd_' +
                                           str(w)+str(d)].data.split()[2]
                    program.rest_sets = form['rst_' +
                                             str(w)+str(d)].data.split()[0]
                    program.rest_reps = form['rst_' +
                                             str(w)+str(d)].data.split()[1]
                    program.prog_group = prog_group
                    i += 1
                    db.session.add(program)
            db.session.commit()
            if not error:
                flash(
                    [f'Thanks for submitting a new routine. Its ID is {prog_group}.'], category='success')
            return redirect(url_for('med.routines'))

        for error in form.errors.values():
            flash(error, category='danger')

    return render_template('med/create.html', form=form)
