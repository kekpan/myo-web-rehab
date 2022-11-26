from flask import Blueprint, abort, flash, redirect, render_template, request, url_for
from flask_login import current_user, login_required

from application.med.forms import AssignForm, ProgramForm
from application.models import Patient, Professional, Program, Session, db

med_bp = Blueprint(
    "med",
    __name__,
    static_folder="static",
    template_folder="templates",
    url_prefix="/med",
)


@med_bp.route("/patients")
@login_required
def patients():
    if not Professional.query.filter_by(username=current_user.username).first():
        abort(403)
    patients = (
        Patient.query.filter_by(pro_id=current_user.id)
        .order_by(Patient.username.asc())
        .all()
    )
    tot_days = []
    pivot = 0
    for i in range(len(patients)):
        if patients[i].prog_group is None:
            patients.insert(pivot, patients.pop(i))
            pivot += 1
    for p in patients:
        tot_days.append(Program.query.filter_by(prog_group=p.prog_group).count())
    return render_template("med/patients.html", patients=patients, tot_days=tot_days)


@med_bp.route("/patients/<username>")
@login_required
def profile(username):
    professional = Professional.query.filter_by(username=current_user.username).first()
    if not professional:
        abort(403)
    patient = Patient.query.filter_by(username=username).first()
    if not patient:
        abort(404)
    if patient.pro_id != professional.id:
        abort(403)
    programs = (
        Program.query.filter_by(prog_group=patient.prog_group)
        .order_by(Program.day_no.desc())
        .all()
    )
    tot_days = len(programs)
    programs = programs[: patient.days_done]
    sessions = (
        Session.query.filter_by(pt_id=patient.id)
        .order_by(Session.start_ts.desc())
        .all()
    )
    return render_template(
        "med/profile.html",
        patient=patient,
        tot_days=tot_days,
        sessions=sessions,
        programs=programs,
    )


@med_bp.route("/routines")
@login_required
def routines():
    professional = Professional.query.filter_by(username=current_user.username).first()
    if not professional:
        abort(403)
    programs = (
        Program.query.filter_by(pro_id=professional.id)
        .order_by(Program.day_no.asc())
        .all()
    )
    programs_dict = {}
    for p in programs:
        if p.prog_group in programs_dict:
            programs_dict[p.prog_group].append(p)
        else:
            programs_dict[p.prog_group] = [p]
    return render_template("med/routines.html", programs_dict=programs_dict)


@med_bp.route("/routines/assign", methods=("GET", "POST"))
@login_required
def assign():
    professional = Professional.query.filter_by(username=current_user.username).first()
    if not professional:
        abort(403)
    if len(Program.query.filter_by(pro_id=current_user.id).all()) == 0:
        flash(
            [f"No routines found to be assigned. First create one."], category="danger"
        )
        return redirect(url_for("med.create"))

    form = AssignForm(request.form)
    programs = (
        Program.query.filter_by(pro_id=professional.id)
        .order_by(Program.day_no.asc())
        .all()
    )
    programs_dict = {}
    for p in programs:
        if p.prog_group in programs_dict:
            programs_dict[p.prog_group].append(p)
        else:
            programs_dict[p.prog_group] = [p]
    form.routine.choices = [
        (key, f"Routine {key} ({value[-1].day_no} days)")
        for key, value in programs_dict.items()
    ]

    if request.args.get("user") is None:
        username = ""
    else:
        username = request.args.get("user")

    if request.method == "POST":
        if form.validate_on_submit():
            patient = Patient.query.filter_by(username=form.username.data).first()
            patient.prog_group = form.routine.data
            db.session.add(patient)
            db.session.commit()
            flash(
                [f"Routine successfully assigned to {patient.username}."],
                category="success",
            )
            return redirect(url_for("med.patients"))

        for error in form.errors.values():
            flash(error, category="danger")

    return render_template(
        "med/assign.html", form=form, programs_dict=programs_dict, username=username
    )


@med_bp.route("/routines/<int:id>")
@login_required
def details(id):
    professional = Professional.query.filter_by(username=current_user.username).first()
    if not professional:
        abort(403)
    programs = Program.query.filter_by(prog_group=id).all()
    if not programs:
        abort(404)
    if programs[0].pro_id != professional.id:
        abort(403)
    pivot = 1
    day = 0
    week_day = []
    for p in programs:
        if pivot == p.week_no:
            day += 1
        else:
            day = 1
        week_day.append(day)
        pivot = p.week_no
    return render_template("med/details.html", programs=programs, week_day=week_day)


@med_bp.route("/routines/new", methods=("GET", "POST"))
@login_required
def create():
    if not Professional.query.filter_by(username=current_user.username).first():
        abort(403)
    form = ProgramForm(request.form)
    if request.method == "POST":
        if form.validate_on_submit():
            idx = 1
            prog_group = (
                Program.query.order_by(Program.prog_group.desc()).first().prog_group + 1
            )
            for w in range(1, 5):
                for d in range(1, 8):
                    if not (w == 1 and d == 1) and (
                        form["skip_" + str(w) + str(d)].data == True
                    ):
                        continue
                    program = Program(
                        week_no=w,
                        day_no=idx,
                        pro_id=Professional.query.filter_by(
                            username=current_user.username
                        )
                        .first()
                        .id,
                    )
                    program.wvi_sets = form["wvis_" + str(w) + str(d)].data
                    program.wvi_reps = form["wvir_" + str(w) + str(d)].data
                    program.wvi_dur = form["wvid_" + str(w) + str(d)].data
                    program.wvo_sets = form["wvos_" + str(w) + str(d)].data
                    program.wvo_reps = form["wvor_" + str(w) + str(d)].data
                    program.wvo_dur = form["wvod_" + str(w) + str(d)].data
                    program.fst_sets = form["fsts_" + str(w) + str(d)].data
                    program.fst_reps = form["fstr_" + str(w) + str(d)].data
                    program.fst_dur = form["fstd_" + str(w) + str(d)].data
                    program.dtp_sets = form["dtps_" + str(w) + str(d)].data
                    program.dtp_reps = form["dtpr_" + str(w) + str(d)].data
                    program.dtp_dur = form["dtpd_" + str(w) + str(d)].data
                    program.fsd_sets = form["fsds_" + str(w) + str(d)].data
                    program.fsd_reps = form["fsdr_" + str(w) + str(d)].data
                    program.fsd_dur = form["fsdd_" + str(w) + str(d)].data
                    program.rest_sets = form["rbts_" + str(w) + str(d)].data
                    program.rest_reps = form["rbtr_" + str(w) + str(d)].data
                    program.prog_group = prog_group
                    idx += 1
                    db.session.add(program)
            db.session.commit()
            flash(
                [f"Thanks for submitting a new routine. Its ID is {prog_group}."],
                category="success",
            )
            return redirect(url_for("med.routines"))

        for error in form.errors.values():
            flash(error, category="danger")

    return render_template("med/create.html", form=form)
